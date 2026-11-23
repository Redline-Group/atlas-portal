// Builds the context one auto-curation run threads through its passes, and holds the two
// things every pass does to it: record a locked decision and note a proposer failure.

import { LLM_CONFIRM_THRESHOLD, buildClaimIndex, forwardLinks } from "./rules.ts";
import type { AutoCurateOptions, Case, ChangeContext, Log, QueueCommit, RunContext } from "./types.ts";

// per-commit change description (PR title + forum edit-list) keyed by the newer sha, for the LLM.
function changesBySha(commits: QueueCommit[] | undefined): Map<string, ChangeContext> {
  const changeBySha = new Map<string, ChangeContext>();
  for (const c of commits || []) if (c.prTitle || c.changeSummary) changeBySha.set(c.sha, { pr: c.pr, title: c.prTitle, summary: c.changeSummary });
  return changeBySha;
}

export function createContext({
  data, commits, propose, haveKey = false,
  noLlm = false, limit = Infinity, threshold = LLM_CONFIRM_THRESHOLD, concurrency = 5,
  containment = true, containThreshold = 0.7, containMargin = 0.15,
  positional = true,
  cluster = false, proposeCluster = null, clusterModels = [], clusterMaxSize = 12, clusterConcurrency = 4, clusterMaxSweeps = 4,
  frontier = false, frontierModel = null, frontierLimit = Infinity, frontierConcurrency = 3,
  cache = new Map(), cheapModel = null,
  log = () => {},
}: AutoCurateOptions): RunContext {
  const cases = data.cases || [];
  return {
    data, commits, cases, propose, proposeCluster, cache, log,
    haveKey, noLlm, limit, threshold, concurrency, containment, containThreshold, containMargin, positional,
    cluster, clusterModels, clusterMaxSize, clusterConcurrency, clusterMaxSweeps,
    frontier, frontierModel, frontierLimit, frontierConcurrency, cheapModel,
    claimIndex: buildClaimIndex(cases), // sole-home signal for the LLM (curate-context)
    changeBySha: changesBySha(data.commits),
    links: forwardLinks(commits),
    decisions: [], proposals: [], cheapPicks: new Map(), // cheapPicks: caseKey -> the cheap LLM's pick (pass 2), for T3
  };
}

// Lock `kase` onto `chosenKey` ("none" = created here), tagged with the mechanism that decided it.
export function record(ctx: RunContext, kase: Case, chosenKey: string, via: string, why?: string, extra?: { corroborator: string }): void {
  ctx.decisions.push({
    caseKey: kase.key, kind: kase.kind, subjectKey: kase.subjectKey,
    newerSha: kase.newerSha, olderSha: kase.olderSha,
    chosenKey, agreedWithAuto: chosenKey === kase.autoKey, auto: via,
    ...(why ? { why } : {}), ...(extra || {}),
  });
}

// Count a proposer failure and log the first three of a pass; the case stays residual.
export function noteError(log: Log, stats: { errors: number }, label: string, key: string, e: unknown): void {
  stats.errors++;
  const message = (e as { message?: unknown } | null | undefined)?.message;
  if (stats.errors <= 3) log(`  ${label} error on ${key}: ${String(message || e).slice(0, 120)}`);
}
