// The sweep pass: the model reads each new or changed document, and each
// unchanged one that links to something that moved, with its neighbours as
// context. A document is recorded as read only when a whole, parseable reply
// covered it; a failed request leaves its documents queued and ends the run.
import { STATE_VERSION, buildBacklinks, planSweep, validateFinding } from "../../../scripts/lib/mistakes-sweep.mjs";
import type { EditDeps, Live } from "./deps.ts";
import { SWEEP_SYSTEM, chunkMessage, packChunks, sweepIndex, type SweepChunk, type SweepIndex } from "./prompt.ts";
import { settledRemovals, sweepQueue, type SweepPlan } from "./queue.ts";
import { candidateKey, type CandidateWrite, type DocState } from "./store.ts";

export const MAX_FAILURES = 3;
const LANGUAGE = new Set(["typo", "grammar", "wrong-word", "markdown", "naming", "placeholder"]);

/** Why the sweep is off for this run, or null when it should run. */
function offReason(deps: EditDeps): string | null {
  return !deps.model ? "no EDIT_CANDIDATES_MODEL"
    : deps.perCycle === 0 ? "EDIT_CANDIDATES_PER_CYCLE=0"
    : deps.monthlyUsd <= 0 ? "EDIT_CANDIDATES_MONTHLY_USD=0"
    : !deps.hasApiKey ? "no OPENROUTER_API_KEY"
    : deps.noFetch ? "ATLAS_WORKER_NO_FETCH=1"
    : null;
}

export const monthOf = (now: number): string => new Date(now).toISOString().slice(0, 7);

/** The reply's findings, or null when it was cut off or is not the JSON object asked for. */
export function parseReply(content: string, finishReason: string | null): unknown[] | null {
  if (finishReason === "length") return null;
  try {
    const rows = (JSON.parse(content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1)) as { findings?: unknown }).findings;
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

/** The rows that name a requested document, quote it verbatim and are not vetoed. */
function validRows(parsed: unknown[], chunk: SweepChunk, live: Live, vetoed: ReadonlySet<string>): CandidateWrite[] {
  const asked = new Set(chunk.docs.map((d) => d.id));
  const out: CandidateWrite[] = [];
  for (const raw of parsed) {
    const row = raw as { uuid?: string; category?: string };
    const v = validateFinding({ ...row, pass: LANGUAGE.has(row.category ?? "") ? "language" : "factual" }, live.nodeMap);
    if (!v.ok || !asked.has(v.finding.uuid ?? "")) {
      console.warn(`  dropped a candidate: ${v.ok ? "not a requested document" : v.reason}`);
      continue;
    }
    if (!vetoed.has(candidateKey(v.finding))) out.push({ ...v.finding, fix: v.finding.fix || null });
  }
  return out;
}

interface Run {
  deps: EditDeps;
  live: Live;
  index: SweepIndex;
  why: Record<string, string>;
  vetoed: ReadonlySet<string>;
  read: Set<string>;
  found: number;
}

/** Whether a request may start now: before the deadline and inside the month's budget. */
async function mayStart(deps: EditDeps, month: string): Promise<boolean> {
  if (deps.now() > deps.deadlineAt) return false;
  if ((await deps.store.loadSpend(month)) + deps.reserveUsd <= deps.monthlyUsd) return true;
  console.warn(`[drift] edit-candidates: the ${month} budget of $${deps.monthlyUsd} is spent; the rest waits for next month`);
  return false;
}

/** One request. Returns false when the run must stop: no request may start, or this one failed. */
async function runChunk(run: Run, chunk: SweepChunk): Promise<boolean> {
  const { deps, live } = run;
  const month = monthOf(deps.now());
  if (!(await mayStart(deps, month))) return false;
  const docs = chunk.docs.map((d) => ({ docId: d.id, digest: live.digest.get(d.id)! }));
  const today = new Date(deps.now()).toISOString().slice(0, 10);
  const reply = await deps.complete(SWEEP_SYSTEM, chunkMessage(chunk, run.index, today, run.why)).catch((e: Error) => e);
  // A failed request may still have been billed, so it is charged the reserve.
  await deps.store.addSpend(month, reply instanceof Error ? deps.reserveUsd : (reply.cost ?? deps.reserveUsd));
  const parsed = reply instanceof Error ? null : parseReply(reply.content, reply.finishReason);
  if (!parsed) {
    console.warn(`  ${docs.length} documents left queued: ${reply instanceof Error ? reply.message : "reply cut off or not JSON"}`);
    await deps.store.bumpFailures(docs);
    return false;
  }
  const rows = validRows(parsed, chunk, live, run.vetoed);
  await deps.store.replace(docs, rows, { source: "worker", model: deps.model });
  for (const d of docs) run.read.add(d.docId);
  run.found += rows.length;
  return true;
}

function linkedLines(plan: SweepPlan, index: SweepIndex): Record<string, string> {
  const title = (id: string): string => index.byId.get(id)?.title ?? "a document the Atlas no longer has";
  return Object.fromEntries(
    Object.entries(plan.linkedBecause).map(([id, targets]) => [id, `Re-read because it links to: ${targets.map(title).join("; ")}, which changed.`]),
  );
}

/** Returns how many documents were read and candidates found, or null when the sweep is off. */
export async function sweepPass(deps: EditDeps, live: Live, vetoed: ReadonlySet<string>): Promise<{ read: number; found: number } | null> {
  const off = offReason(deps);
  if (off) {
    console.log(`sync:edit-candidates: sweep off (${off})`);
    return null;
  }
  const states = await deps.store.loadDocStates();
  const known = Object.fromEntries([...states].filter(([, s]) => s.digest).map(([id, s]) => [id, s.digest]));
  const state = { version: STATE_VERSION, atlasSha: null, sweptAt: null, docs: known };
  const plan: SweepPlan = planSweep(live.docs, state, { backlinks: buildBacklinks(live.docs) });
  const parked = (id: string): boolean => isParked(states.get(id), live.digest.get(id));
  const index = sweepIndex(live.docs);
  const run: Run = { deps, live, index, why: linkedLines(plan, index), vetoed, read: new Set(), found: 0 };
  const queue = sweepQueue(plan, deps.perCycle, parked).map((id) => index.byId.get(id)!);
  // One request at a time, so each sees the spend of the one before it.
  for (const chunk of packChunks(queue, index)) if (!(await runChunk(run, chunk))) break;
  await deps.store.dropCandidatesOf(plan.removed);
  await deps.store.forgetDocs(settledRemovals(plan, run.read));
  const stuck = [...plan.new, ...plan.changed].filter(parked).length;
  if (stuck) console.warn(`[drift] edit-candidates: ${stuck} documents failed ${MAX_FAILURES} times and are parked until they change`);
  console.log(`sync:edit-candidates: sweep: ${plan.new.length + plan.changed.length} moved, ${run.read.size} read, ${run.found} candidates`);
  return { read: run.read.size, found: run.found };
}

const isParked = (s: DocState | undefined, digest: string | undefined): boolean =>
  !!s && s.failures >= MAX_FAILURES && s.failed_digest === digest;
