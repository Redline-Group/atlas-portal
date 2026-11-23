// The deterministic, free locks that run before any model is asked. Each needs TWO independent
// signals to agree; a case none of them locks is queued for the LLM when the matcher is confident.
//
// pass 1 — lock every case the independent forward pass corroborates.
// pass 1.5 — reverse∩containment: an INDEPENDENT, order-sensitive, typo-tolerant match
//   (ordered-containment.mjs, ported from the UUID-swap detector) that ALSO lands on the
//   matcher's autoKey with a clear margin over the runner-up. Different failure modes from
//   shingle-Jaccard, so the agreement is real corroboration — and, unlike the forward pass,
//   it reaches across the #117 seed seam. Deterministic + free, so it runs before the LLM.
//   The remaining ≥threshold-confident cases go to the (optional) LLM cross-check.
// pass 1.6 — positional∩{matcher,forward,containment}: an INDEPENDENT structural signal
//   (ancestry + neighbour-title + reference overlap; history-positional.mjs) that reads a
//   doc's POSITION, not its body, so it's strongest exactly where the three content passes
//   are blind — near-identical siblings. It only LOCKS when its pick lines up with an
//   existing content signal (matcher/forward/containment via frontierCorroborator), so it
//   stays within the two-independent-signals invariant. Deterministic + free → runs with
//   the other deterministic passes, before the LLM. Measured ~0 genuinely-wrong-document
//   locks on the resolved pool; its incremental value is cases forward/containment miss.

import { record } from "./context.ts";
import { forwardAgrees, frontierCorroborator, llmEligible } from "./rules.ts";
import { containmentBest, positionalPickFor } from "./signals.ts";
import type { Case, RunContext } from "./types.ts";

type Mechanism = "forward-reverse" | "containment" | "positional";
export interface DeterministicResult { llmQueue: Case[]; locked: Record<Mechanism, number> }

// Lock `kase` by the first deterministic pass that corroborates it; null leaves it unresolved.
function lockDeterministic(ctx: RunContext, kase: Case): Mechanism | null {
  const fwd = ctx.links.get(kase.key) ?? null;
  if (kase.autoKey && forwardAgrees(kase, fwd)) { record(ctx, kase, kase.autoKey, "forward-reverse"); return "forward-reverse"; }
  // compute the containment best ONCE — reused by the containment lock (score/margin-gated
  // on the matcher's autoKey) and, unconditionally, as a positional corroborator.
  const contain = ctx.containment ? containmentBest(ctx.data, kase) : null;
  if (contain?.best && kase.autoKey && contain.best.key === kase.autoKey && contain.bestScore >= ctx.containThreshold && contain.margin >= ctx.containMargin) {
    record(ctx, kase, kase.autoKey, "containment"); return "containment";
  }
  if (ctx.positional) {
    const pick = positionalPickFor(ctx.data, kase);
    const corr = pick && frontierCorroborator(pick.chosenKey, { autoKey: kase.autoKey, fwdKey: fwd, containKey: contain?.best?.key ?? null });
    if (corr) { record(ctx, kase, pick.chosenKey, "positional", "", { corroborator: corr }); return "positional"; }
  }
  return null;
}

export function runDeterministicPasses(ctx: RunContext, alreadyAssigned: Set<string>): DeterministicResult {
  const llmQueue: Case[] = [];
  const locked = { "forward-reverse": 0, containment: 0, positional: 0 };
  for (const kase of ctx.cases) {
    if (alreadyAssigned.has(kase.key)) continue; // already assigned by the bijection pass
    const via = lockDeterministic(ctx, kase);
    if (via) locked[via]++;
    else if (llmEligible(kase, ctx.threshold)) llmQueue.push(kase); // counted regardless; --no-llm just won't ask
  }
  const { containment, positional, threshold } = ctx;
  ctx.log(`pass 1 (forward∩reverse): ${locked["forward-reverse"]} locked${containment ? `  ·  pass 1.5 (reverse∩containment): ${locked.containment} locked` : ""}${positional ? `  ·  pass 1.6 (positional∩signal): ${locked.positional} locked` : ""}  ·  ${llmQueue.length} ≥${threshold}-confident left for the LLM`);
  return { llmQueue, locked };
}
