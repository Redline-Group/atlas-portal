// One cluster-pass window: lock only what every family model agrees on, conflict-free.

import { noteError, record } from "./context.ts";
import { enrichCandidates, enrichSubject } from "./rules.ts";
import type { Case, ChangeContext, ClusterAssignment, ClusterEntry, ClusterSubject, ProposeCluster, RunContext } from "./types.ts";

export interface ClusterStats {
  multiClusters: number; windowed: number; cases: number; locked: number; lockedNone: number;
  disagreed: number; conflicts: number; errors: number; cached: number; models: string[] | null;
}
export interface ClusterRun { ctx: RunContext; stats: ClusterStats; byKey: Map<string, Case>; proposeCluster: ProposeCluster }
type Lock = Pick<ClusterAssignment, "subjectKey" | "chosenKey">;
interface WindowResult { locks: Lock[]; disagreed: number; conflicts: number }

const cluKey = (model: string, anchor: string) => `cluster|${model}|${anchor}`;

function windowSubjects({ ctx, byKey }: ClusterRun, subjKeys: string[]): ClusterSubject[] {
  const subjects: ClusterSubject[] = [];
  for (const k of subjKeys) {
    const kase = byKey.get(k)!;
    const s = enrichSubject(kase.subjectKey, ctx.data.nodes);
    if (s) subjects.push({ key: k, order: kase.subjectOrder, ...s });
  }
  return subjects;
}

function reconcile(votes: Map<string, string[]>, modelCount: number): WindowResult {
  const agreed: Lock[] = [];
  let disagreed = 0;
  for (const [subjectKey, arr] of votes) {
    if (arr.length === modelCount && arr.every((v) => v === arr[0])) agreed.push({ subjectKey, chosenKey: arr[0] });
    else disagreed++;
  }
  const claimCount = new Map<string, number>();
  for (const a of agreed) if (a.chosenKey !== "none") claimCount.set(a.chosenKey, (claimCount.get(a.chosenKey) || 0) + 1);
  const locks: Lock[] = []; let conflicts = 0;
  for (const a of agreed) {
    if (a.chosenKey !== "none" && claimCount.get(a.chosenKey)! > 1) { conflicts++; continue; }
    locks.push(a);
  }
  return { locks, disagreed, conflicts };
}

// Never throws: a model error drops the window and its subjects stay residual.
export async function resolveWindow(run: ClusterRun, subjKeys: string[], candKeys: string[], change: ChangeContext | undefined): Promise<WindowResult> {
  const { ctx, stats } = run;
  const subjects = windowSubjects(run, subjKeys);
  const candidates = enrichCandidates({ candidates: candKeys.map((key) => ({ key })) }, ctx.data.nodes, ctx.claimIndex);
  if (subjects.length < 1 || !candidates.length) return { locks: [], disagreed: 0, conflicts: 0 };
  const anchor = [...subjKeys].sort().join(",");
  const votes = new Map<string, string[]>();
  try {
    for (const model of ctx.clusterModels) {
      const hit = ctx.cache.get(cluKey(model, anchor)) as ClusterEntry | undefined;
      let assignments;
      if (hit) { assignments = hit.assignments; stats.cached++; }
      else { assignments = (await run.proposeCluster(subjects, candidates, { model, change })).assignments; ctx.cache.set(cluKey(model, anchor), { model, assignments }); }
      for (const a of assignments) { const arr = votes.get(a.subjectKey) || []; arr.push(a.chosenKey); votes.set(a.subjectKey, arr); }
    }
  } catch (e) {
    noteError(ctx.log, stats, "cluster", subjKeys[0], e);
    return { locks: [], disagreed: 0, conflicts: 0 };
  }
  return reconcile(votes, ctx.clusterModels.length);
}

export function commitLocks({ ctx, stats, byKey }: ClusterRun, locks: Lock[]): void {
  for (const a of locks) {
    record(ctx, byKey.get(a.subjectKey)!, a.chosenKey, "cluster", "", { corroborator: "family-agreement" });
    if (a.chosenKey === "none") stats.lockedNone++; else stats.locked++;
  }
}
