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

// One run at a time across callers. Any fixed key no other lock uses; see sync-briefings.ts.
const LOCK_KEY = 4711_2063;

/** Runs `fn` unless another run holds the lock. A database that cannot be asked runs unlocked: a doubled run is bounded by the budget. */
async function withLock(fn: () => Promise<void>): Promise<void> {
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

async function complete(system: string, user: string) {
  const res = await getClient().chat.completions.create(
    {
      model: config.editCandidatesModel,
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
  // OpenRouter can answer 200 with an error body and no choices.
  const choice = res.choices?.[0];
  if (!choice) throw new Error(`no choices in response: ${JSON.stringify(res).slice(0, 200)}`);
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
    model: config.editCandidatesModel,
    perCycle: config.editCandidatesPerCycle,
    monthlyUsd: config.editCandidatesMonthlyUsd,
    reserveUsd: config.editCandidatesReserveUsd,
    hasApiKey: Boolean(config.openrouterApiKey),
    noFetch: process.env.ATLAS_WORKER_NO_FETCH === "1",
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
  const live = liveView(docs);
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
