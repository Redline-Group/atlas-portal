// sync:edit-candidates: the atlas worker tail behind the Edit Candidates
// report. Three passes under one advisory lock, each writing as it goes:
//
//   1. seed   load the committed, reviewed sweep when its files changed
//   2. veto   remove every stored candidate a review has rejected
//   3. sweep  have a model read new and changed documents, inside the month's
//             budget (EDIT_CANDIDATES_MONTHLY_USD)
//
//   bun src/server/sync-edit-candidates.ts
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getClient } from "./chat/llm.ts";
import { config } from "./config.ts";
import { sql } from "./db.ts";
import { liveView, type EditDeps } from "./edit-candidates/deps.ts";
import { seedPass, vetoPass } from "./edit-candidates/seed.ts";
import { realStore } from "./edit-candidates/store-pg.ts";
import { sweepPass } from "./edit-candidates/sweep.ts";
import { runMigrations } from "./migrate.ts";
import { shutdownPosthog } from "./posthog-node.ts";

// Measured numbers are in edit-candidates/CLAUDE.md. One request holds about
// 40 KB of documents and context and costs about $0.06 on Gemini 4 Carbon; the
// reserve is what a request is assumed to cost before the provider reports it,
// so the month stops one reserve short of the budget.
const env = process.env;
const MODEL = env.EDIT_CANDIDATES_MODEL ?? "google/gemini-4-carbon";

// One run at a time across callers. Any fixed key no other lock uses; see sync-briefings.ts.
const LOCK_KEY = 4711_2063;

/** Runs `fn` unless another run holds the lock. A database that cannot be asked runs unlocked: a doubled run is bounded by the budget. */
export async function withLock(fn: () => Promise<void>): Promise<void> {
  const reserved = await sql.reserve().catch(() => null);
  let mine = false;
  try {
    if (reserved) {
      const rows = (await reserved`SELECT pg_try_advisory_lock(${LOCK_KEY}) AS ok`) as { ok: boolean }[];
      mine = Boolean(rows[0]?.ok);
      if (!mine) return console.log("sync:edit-candidates: another run holds the lock; skipping");
    }
    await fn();
  } finally {
    if (mine) await reserved!`SELECT pg_advisory_unlock(${LOCK_KEY})`.catch(() => undefined);
    reserved?.release();
  }
}

const request = (system: string, user: string) =>
  getClient().chat.completions.create(
    {
      model: MODEL,
      temperature: 0,
      max_tokens: 20_000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    { timeout: 240_000, maxRetries: 0 },
  );

/** Whether a failed request can have been charged: only one that timed out while the model was working. */
export const maybeBilled = (e: { status?: unknown; name?: string }): boolean =>
  e.name === "APIConnectionTimeoutError" || (typeof e.status !== "number" && e.name !== "APIConnectionError");

async function complete(system: string, user: string) {
  const res = await request(system, user).catch((e: Error) => {
    throw Object.assign(e, { billed: maybeBilled(e) });
  });
  // OpenRouter can answer 200 with an error body and no choices, which it does not charge for.
  const choice = res.choices?.[0];
  if (!choice) throw Object.assign(new Error(`no choices in response: ${JSON.stringify(res).slice(0, 200)}`), { billed: false });
  const cost = (res.usage as { cost?: unknown } | undefined)?.cost;
  return { content: choice.message?.content ?? "", finishReason: choice.finish_reason ?? null, cost: typeof cost === "number" ? cost : null };
}

function readSeed() {
  const artifact = join(config.publicDir, "potential-mistakes.json");
  const state = resolve(config.publicDir, "../.github/mistakes-sweep-state.json");
  return existsSync(artifact) && existsSync(state) ? { artifact: readFileSync(artifact), state: readFileSync(state) } : null;
}

// The worker kills its tails eleven minutes after it starts, and a request may
// take four, so no request starts after six.
export function realDeps(): EditDeps {
  return {
    runMigrations,
    store: realStore,
    readSeed,
    complete,
    model: MODEL,
    perCycle: Number(env.EDIT_CANDIDATES_PER_CYCLE ?? 150),
    monthlyUsd: Number(env.EDIT_CANDIDATES_MONTHLY_USD ?? 5),
    reserveUsd: Number(env.EDIT_CANDIDATES_RESERVE_USD ?? 0.5),
    hasApiKey: Boolean(config.openrouterApiKey),
    noFetch: env.ATLAS_WORKER_NO_FETCH === "1",
    deadlineAt: Date.now() - process.uptime() * 1000 + 6 * 60_000,
    now: () => Date.now(),
  };
}

export async function runEditCandidates(deps: EditDeps): Promise<void> {
  await deps.runMigrations();
  const { atlasSha, docs } = await deps.store.loadSnapshot();
  // An unsynced database is a precondition failure, not "nothing to do".
  if (docs.length === 0) return console.warn("sync:edit-candidates: atlas_doc_meta is empty (structural sync has not run); skipping");
  console.log(`sync:edit-candidates: ${docs.length} docs, atlas ${(atlasSha ?? "unknown").slice(0, 12)}`);
  const live = liveView(docs, atlasSha);
  await seedPass(deps, live);
  const vetoed = await vetoPass(deps);
  await sweepPass(deps, live, vetoed);
}

// Only when launched directly: the worker shells out to this file, and a test that imports it must not start a run.
if (import.meta.main) {
  try {
    await withLock(() => runEditCandidates(realDeps()));
  } finally {
    await sql.end();
    await shutdownPosthog();
  }
}
