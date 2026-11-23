// Deterministic, free locks (forward, containment, positional) that run before any model; each needs
// two independent signals to agree, so positional locks only when a content signal backs its pick.

import { record } from "./context.ts";
import { forwardAgrees, frontierCorroborator, llmEligible } from "./rules.ts";
import { containmentBest, positionalPickFor } from "./signals.ts";
import type { Case, RunContext } from "./types.ts";

type Mechanism = "forward-reverse" | "containment" | "positional";
export interface DeterministicResult { llmQueue: Case[]; locked: Record<Mechanism, number> }

function lockDeterministic(ctx: RunContext, kase: Case): Mechanism | null {
  const fwd = ctx.links.get(kase.key) ?? null;
  if (kase.autoKey && forwardAgrees(kase, fwd)) { record(ctx, kase, kase.autoKey, "forward-reverse"); return "forward-reverse"; }
  // Also needed unconditionally as a positional corroborator.
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
    if (alreadyAssigned.has(kase.key)) continue;
    const via = lockDeterministic(ctx, kase);
    if (via) locked[via]++;
    else if (llmEligible(kase, ctx.threshold)) llmQueue.push(kase);
  }
  const { containment, positional, threshold } = ctx;
  ctx.log(`pass 1 (forward∩reverse): ${locked["forward-reverse"]} locked${containment ? `  ·  pass 1.5 (reverse∩containment): ${locked.containment} locked` : ""}${positional ? `  ·  pass 1.6 (positional∩signal): ${locked.positional} locked` : ""}  ·  ${llmQueue.length} ≥${threshold}-confident left for the LLM`);
  return { llmQueue, locked };
}
