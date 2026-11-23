// pass 1.7 — CLUSTER (matrix) joint assignment. The per-doc LLM (pass 2) judges each case
// alone, so it can't honour "one older row is the predecessor of AT MOST ONE newer row";
// near-identical siblings that share candidates get collapsed onto the same predecessor (a
// matcher failure we measured: e.g. 9 identical "Rate Limits" docs all mapped to one occurrence).
// This groups the residual into CLUSTERS (connected components of the subject↔candidate graph)
// and assigns each JOINTLY under mutual-exclusion, LOCKING a subject only when TWO DIFFERENT-family
// models AGREE and the pick is globally conflict-free — a stronger, more independent corroborator
// than LLM∩matcher (the matcher is exactly what fails here). Disagreements stay residual (frontier/
// human). OVERSIZED clusters (too many subjects for one prompt) are DECOMPOSED into position-ordered
// subject WINDOWS: each window carries the candidate-complete union of its subjects' own candidates
// (guarantees a subject never loses its true ancestor — no margin to tune) and locked candidates are
// removed between sweeps (mutual-exclusion across windows); sweeps repeat until no new locks (loop-
// until-dry). Cluster members are excluded from pass 2 — the per-doc weak signal shouldn't relock.

import { mapPool } from "../../../src/server/pool.ts";
import { commitLocks, resolveWindow, type ClusterRun, type ClusterStats } from "./cluster-window.ts";
import { buildClusters, type Cluster } from "./rules.ts";
import { bySubjectOrder } from "./signals.ts";
import type { ChangeContext, RunContext } from "./types.ts";

// `members` is every case in a multi-cluster — kept off pass 2.
export interface ClusterResult { members: Set<string>; stats: ClusterStats }

const occN = (k: string) => { const s = k.split("#")[1]; return s ? Number(s) : Number.POSITIVE_INFINITY; };

// The residual clusters of two or more cases, built from what the earlier passes left unclaimed.
function multiClusters(ctx: RunContext): Cluster[] {
  const doneNow = new Set(ctx.decisions.map((d) => d.caseKey));
  const claimed = new Set(ctx.decisions.filter((d) => d.chosenKey && d.chosenKey !== "none").map((d) => d.chosenKey));
  const { clusters } = buildClusters(ctx.cases, doneNow, claimed, { maxSize: ctx.clusterMaxSize });
  return clusters.filter((c) => c.size >= 2);
}

// fits one prompt → assign whole
async function assignWhole(run: ClusterRun, cl: Cluster, change: ChangeContext | undefined): Promise<void> {
  const { locks, disagreed, conflicts } = await resolveWindow(run, cl.caseKeys, cl.candidateKeys, change);
  commitLocks(run, locks); run.stats.disagreed += disagreed; run.stats.conflicts += conflicts;
}

// candidate-complete: the union of THIS window's subjects' own candidates, still available.
function windowCandidates({ byKey }: ClusterRun, win: string[], avail: Set<string>): string[] {
  return [...new Set(win.flatMap((k) => (byKey.get(k)!.candidates || []).map((c) => c.key)).filter((k) => avail.has(k)))]
    .sort((a, b) => occN(a) - occN(b) || a.localeCompare(b));
}

// oversized → position-ordered subject windows, candidate-complete per window, remove locked
// candidates between sweeps, loop-until-dry (no new locks in a full sweep ⇒ the rest is residual).
async function sweepWindows(run: ClusterRun, cl: Cluster, change: ChangeContext | undefined): Promise<void> {
  const { byKey, stats, ctx } = run;
  let remaining = cl.caseKeys.slice().sort((a, b) => bySubjectOrder(byKey.get(a)!, byKey.get(b)!));
  const avail = new Set(cl.candidateKeys);
  const W = ctx.clusterMaxSize, MAX_SWEEPS = ctx.clusterMaxSweeps;
  for (let sweep = 0; sweep < MAX_SWEEPS && remaining.length; sweep++) {
    let progressed = false;
    const survivors: string[] = [];
    for (let i = 0; i < remaining.length; i += W) {
      const win = remaining.slice(i, i + W);
      const { locks, conflicts } = await resolveWindow(run, win, windowCandidates(run, win, avail), change);
      stats.conflicts += conflicts;
      const lockedSet = new Set(locks.map((l) => l.subjectKey));
      commitLocks(run, locks);
      for (const l of locks) if (l.chosenKey !== "none") avail.delete(l.chosenKey);
      if (locks.length) progressed = true;
      for (const k of win) if (!lockedSet.has(k)) survivors.push(k); // unlocked → retry next sweep (fewer candidates)
    }
    remaining = survivors;
    if (!progressed) break; // a full sweep locked nothing new → remaining is genuinely residual
  }
  stats.disagreed += remaining.length; // whatever survived every sweep stays for the frontier/human
}

async function resolveClusters(run: ClusterRun, multi: Cluster[]): Promise<void> {
  const { ctx, stats } = run;
  stats.multiClusters = multi.length;
  stats.windowed = multi.filter((c) => c.oversized).length;
  stats.cases = multi.reduce((s, c) => s + c.size, 0);
  ctx.log(`pass 1.7 (cluster ${ctx.clusterModels.join(" ∩ ")}): ${multi.length} multi-clusters, ${stats.cases} cases${stats.windowed ? `  ·  ${stats.windowed} oversized → windowed decomposition` : ""}…`);
  await mapPool(multi, ctx.clusterConcurrency, (cl) => {
    const change = ctx.changeBySha.get(run.byKey.get(cl.caseKeys[0])!.newerSha);
    return cl.oversized ? sweepWindows(run, cl, change) : assignWhole(run, cl, change);
  });
  ctx.log(`pass 1.7 (cluster): ${stats.locked} locked · ${stats.lockedNone} created-here · ${stats.disagreed} residual/disagreed · ${stats.conflicts} conflicts · ${stats.cached} cached · ${stats.errors} errors`);
}

export async function runClusterPass(ctx: RunContext): Promise<ClusterResult> {
  const stats: ClusterStats = { multiClusters: 0, windowed: 0, cases: 0, locked: 0, lockedNone: 0, disagreed: 0, conflicts: 0, errors: 0, cached: 0, models: ctx.cluster ? ctx.clusterModels : null };
  const members = new Set<string>();
  const { proposeCluster } = ctx;
  if (ctx.cluster && !ctx.noLlm && ctx.haveKey && proposeCluster && ctx.clusterModels.length >= 2) {
    const multi = multiClusters(ctx);
    for (const cl of multi) for (const k of cl.caseKeys) members.add(k);
    await resolveClusters({ ctx, stats, proposeCluster, byKey: new Map(ctx.cases.map((c) => [c.key, c])) }, multi);
  }
  return { members, stats };
}
