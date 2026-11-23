// pass 1.7 — cluster joint assignment under mutual exclusion; a subject locks only when two
// different-family models agree, since the per-doc LLM collapses identical siblings onto one predecessor.

import { mapPool } from "../../../src/server/pool.ts";
import { commitLocks, resolveWindow, type ClusterRun, type ClusterStats } from "./cluster-window.ts";
import { buildClusters, type Cluster } from "./rules.ts";
import { bySubjectOrder } from "./signals.ts";
import type { ChangeContext, RunContext } from "./types.ts";

// `members` stay off pass 2: the per-doc weak signal must not relock them.
export interface ClusterResult { members: Set<string>; stats: ClusterStats }

const occN = (k: string) => { const s = k.split("#")[1]; return s ? Number(s) : Number.POSITIVE_INFINITY; };

function multiClusters(ctx: RunContext): Cluster[] {
  const doneNow = new Set(ctx.decisions.map((d) => d.caseKey));
  const claimed = new Set(ctx.decisions.filter((d) => d.chosenKey && d.chosenKey !== "none").map((d) => d.chosenKey));
  const { clusters } = buildClusters(ctx.cases, doneNow, claimed, { maxSize: ctx.clusterMaxSize });
  return clusters.filter((c) => c.size >= 2);
}

async function assignWhole(run: ClusterRun, cl: Cluster, change: ChangeContext | undefined): Promise<void> {
  const { locks, disagreed, conflicts } = await resolveWindow(run, cl.caseKeys, cl.candidateKeys, change);
  commitLocks(run, locks); run.stats.disagreed += disagreed; run.stats.conflicts += conflicts;
}

// Candidate-complete per window, so a subject never loses its true ancestor.
function windowCandidates({ byKey }: ClusterRun, win: string[], avail: Set<string>): string[] {
  return [...new Set(win.flatMap((k) => (byKey.get(k)!.candidates || []).map((c) => c.key)).filter((k) => avail.has(k)))]
    .sort((a, b) => occN(a) - occN(b) || a.localeCompare(b));
}

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
      for (const k of win) if (!lockedSet.has(k)) survivors.push(k);
    }
    remaining = survivors;
    if (!progressed) break;
  }
  stats.disagreed += remaining.length;
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
