// The atlas worker's best-effort side steps; atlas-worker.mjs owns the control flow.
// An entry is `{ id, phase, label?, skipWhenNoFetch?, skipWhenInert?, onlyWhenInert?, run(ctx) }`:
//   "tick" — before the drift check, sequentially, ctx.db open; a line names
//            the step as it starts, run() returns its closing line (logged
//            with the step's time); a throw is logged and the tick carries on.
//            skipWhenNoFetch is the line logged instead under --no-fetch.
//   "tail" — after the heartbeat, in parallel, ctx.db closed; run() returns
//            the child's promise; a rejection never fails the run.
// In a PR environment (ctx.inert, src/server/pr-env/gate.ts) noFetch is also
// set, and skipWhenInert is the line logged instead of a step that would still
// call an outside API under --no-fetch, or would find nothing to read there (its
// inputs are not in the image). An onlyWhenInert step runs nowhere else
// and is skipped silently.
// ctx: { db, full, noFetch, inert, env, runAsync(cmd, args, opts?), log(line), warn(line) }
import prEnvCopy from "./pr-env-copy.ts";
import prState from "./pr-state.mjs";
import chainState from "./chain-state.mjs";
import balances from "./balances.mjs";
import forum from "./forum.mjs";
import pau from "./pau.mjs";
import pauOrigin from "./pau-origin.ts";
import pauSpellSources from "./pau-spell-sources.ts";
import voteArchive from "./vote-archive.ts";
import prSpells from "./pr-spells.ts";
import { TAIL_LANES } from "./tail.mjs";

export const WORKER_STEPS = [prEnvCopy, prState, chainState, balances, pau, pauOrigin, pauSpellSources, voteArchive, prSpells, forum, ...TAIL_LANES];

export function stepsIn(steps, phase) {
  return steps.filter((s) => s.phase === phase);
}

const message = (e) => e?.message ?? e;
const since = (t0) => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

/** The line logged instead of running a step in this context, "" to skip silently, null to run it. */
function skipLine(step, ctx) {
  if (step.onlyWhenInert && !ctx.inert) return "";
  if (ctx.inert && step.skipWhenInert) return step.skipWhenInert;
  if (ctx.noFetch && step.skipWhenNoFetch) return step.skipWhenNoFetch;
  return null;
}

/** The steps of one phase that run in this context; each skipped one logs its line. */
function runnable(steps, phase, ctx) {
  return stepsIn(steps, phase).filter((step) => {
    const line = skipLine(step, ctx);
    if (line) ctx.log(`atlas-worker: ${line}`);
    return line === null;
  });
}

/** Tick phase: in declared order, one at a time, warn-and-continue. */
export async function runTickSteps(steps, ctx) {
  for (const step of stepsIn(steps, "tick")) {
    const line = skipLine(step, ctx);
    if (line !== null) {
      if (line) ctx.log(`atlas-worker: ${line}`);
      continue;
    }
    // Logged before it runs, so a step that never returns is the last line of a stuck run.
    ctx.log(`atlas-worker: ${step.label ?? step.id}…`);
    const t0 = Date.now();
    try {
      ctx.log(`atlas-worker: ${await step.run(ctx)} (${since(t0)})`);
    } catch (e) {
      ctx.warn(`atlas-worker: ${step.label ?? step.id} skipped — ${message(e)} (${since(t0)})`);
    }
  }
}

/** Tail phase: every lane started at once, settled together, failures warned in declared order. */
export async function runTailSteps(steps, ctx) {
  const lanes = runnable(steps, "tail", ctx);
  const t0 = Date.now();
  // async wrapper: a lane that throws synchronously becomes a rejection, not a crash.
  // Each lane logs as it finishes, so the one a stuck run waits on is the lane with no line.
  const results = await Promise.allSettled(
    lanes.map(async (lane) => {
      await lane.run(ctx);
      ctx.log(`atlas-worker: ${lane.id} finished (${since(t0)})`);
    }),
  );
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      ctx.warn(`atlas-worker: ${lanes[i].id} reconcile error: ${message(result.reason)}`);
    }
  });
}
