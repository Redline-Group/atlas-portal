// Orchestrator for the HTML-era auto-resolution passes; no file/git IO, the caller injects `propose` and `log`.

import { runBijectionPass, type BijectionResult } from "./auto-curate-run/bijection.ts";
import { runClusterPass } from "./auto-curate-run/cluster-pass.ts";
import type { ClusterStats } from "./auto-curate-run/cluster-window.ts";
import { sweepConflicts } from "./auto-curate-run/conflict-sweep.ts";
import { createContext } from "./auto-curate-run/context.ts";
import { runDeterministicPasses, type DeterministicResult } from "./auto-curate-run/deterministic.ts";
import { runFrontierPass, type FrontierStats } from "./auto-curate-run/frontier-pass.ts";
import { runLlmPass, type LlmStats } from "./auto-curate-run/llm-pass.ts";
import { addPositionalHints } from "./auto-curate-run/positional-hints.ts";
import type { AutoCurateOptions } from "./auto-curate-run/types.ts";

interface PassResults {
  totalCases: number; resolved: number; residual: number; conflictsDemoted: number; positionalHints: number;
  bijection: BijectionResult; locked: DeterministicResult["locked"]; clu: ClusterStats; llm: LlmStats; front: FrontierStats;
}

function summarize({ totalCases, resolved, residual, conflictsDemoted, positionalHints, bijection, locked, clu, llm, front }: PassResults) {
  return {
    totalCases, resolved, conflictsDemoted,
    resolvedByBijection: bijection.resolved, resolvedBySplit: bijection.split,
    resolvedByForwardReverse: locked["forward-reverse"], resolvedByContainment: locked.containment, resolvedByPositional: locked.positional,
    positionalHints,
    resolvedByCluster: clu.locked + clu.lockedNone, clusterDisagreed: clu.disagreed, clusterWindowed: clu.windowed,
    resolvedByLlm: llm.confirmed,
    resolvedByFrontier: front.locked, frontierHints: front.hints, frontierCalls: front.considered, frontierCached: front.cached,
    llmCached: llm.cached,
    frontierModel: front.model,
    residual,
    reductionPct: +((resolved / Math.max(1, totalCases)) * 100).toFixed(1),
    llm, cluster: clu, frontier: front,
  };
}

export async function runAutoCurate(options: AutoCurateOptions) {
  const ctx = createContext(options);
  const bijection = runBijectionPass(ctx);
  const { llmQueue, locked } = runDeterministicPasses(ctx, bijection.done);
  const cluster = await runClusterPass(ctx);
  const llm = await runLlmPass(ctx, llmQueue.filter((k) => !cluster.members.has(k.key)));
  const front = await runFrontierPass(ctx);
  const { kept, demoted } = sweepConflicts(ctx.decisions, ctx.log);
  const resolvedKeys = new Set(kept.map((d) => d.caseKey));
  const residual = ctx.cases.filter((c) => !resolvedKeys.has(c.key));
  const positionalHints = ctx.positional ? addPositionalHints(ctx, residual) : 0;
  const summary = summarize({
    totalCases: ctx.cases.length, resolved: kept.length, residual: residual.length, conflictsDemoted: demoted, positionalHints,
    bijection, locked, clu: cluster.stats, llm, front,
  });
  return { decisions: kept, proposals: ctx.proposals, summary, residual, cache: ctx.cache };
}
