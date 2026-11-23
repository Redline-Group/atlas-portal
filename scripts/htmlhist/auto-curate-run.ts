// Orchestrator for the two HTML-era auto-resolution passes (plan §10.4). Separated
// from the pure rules (auto-curate.mjs) and from IO/CLI (the aux scripts) so it can be
// reused by BOTH entry points — the standalone `auto-curate-html-history.mjs` and the
// combined `build-history-curation.mjs --auto` — and unit-tested with a stub proposer.
//
// It performs NO file/git IO and imports no LLM client: the caller injects `propose`
// (the LLM proposer) and `log`, and passes the already-loaded `commits` so the slow
// turndown isn't repeated when the curation queue build already has them in memory.
//
// Each pass is one module under auto-curate-run/; they share a RunContext (types.ts).

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

// Run pass 0 (bijection), pass 1 (forward∩reverse, deterministic), pass 1.5 (reverse∩containment),
// pass 1.6 (positional∩signal), pass 1.7 (cluster, opt-in), pass 2 (LLM∩matcher, ≥threshold,
// opt-in), then pass 3 (frontier-model escalation on the uncertain residual, opt-in) over a
// curation queue. Returns { decisions, proposals, summary, residual, cache }.
//   data     — the curation artifact ({ meta, nodes, cases })
//   commits  — loaded HTML commits oldest→newest, nodes carrying contentHash
//   propose  — async (subject, candidates, opts?) => { chosenKey, why } (the LLM proposer;
//              opts.model lets pass 3 route to the frontier model)
//   haveKey  — whether an LLM key is configured (gates passes 2 & 3)
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
