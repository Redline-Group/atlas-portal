// pass 2 — per-doc LLM second opinion; locks only where it agrees with the matcher.

import { applyCached, askAll, capAsks, type AskPass, type AskStats } from "./ask.ts";
import { record } from "./context.ts";
import { llmConfirms } from "./rules.ts";
import type { Case, Propose, RunContext } from "./types.ts";

export interface LlmStats extends AskStats { eligible: number; confirmed: number; disagreed: number; threshold: number }

// The pick is remembered for pass 3's trigger even when it does not lock.
function applyCheap(ctx: RunContext, llm: LlmStats, kase: Case, chosenKey: string, why: string): void {
  ctx.cheapPicks.set(kase.key, chosenKey);
  if (kase.autoKey && llmConfirms(kase, chosenKey)) { record(ctx, kase, kase.autoKey, "llm-90", why); llm.confirmed++; }
  else llm.disagreed++;
}

async function askCheap(ctx: RunContext, propose: Propose, queue: Case[], llm: LlmStats): Promise<void> {
  const pass: AskPass<{ kase: Case }> = {
    name: "cheap", label: "llm", model: ctx.cheapModel, concurrency: ctx.concurrency, stats: llm, propose,
    apply: ({ kase }, chosenKey, why) => applyCheap(ctx, llm, kase, chosenKey, why),
    progress: () => `${llm.confirmed} confirmed`,
  };
  const uncached = applyCached(ctx, pass, queue.map((kase) => ({ kase })));
  const toAsk = capAsks(uncached, ctx.limit, llm);
  ctx.log(`pass 2 (LLM∩matcher): ${llm.cached} cached · asking ${toAsk.length}/${uncached.length} new (concurrency ${ctx.concurrency})…`);
  await askAll(ctx, pass, toAsk);
  ctx.log(`pass 2 (LLM∩matcher): ${llm.confirmed} locked · ${llm.disagreed} disagreed · ${llm.cached} cached · ${llm.errors} errors`);
}

export async function runLlmPass(ctx: RunContext, queue: Case[]): Promise<LlmStats> {
  const llm: LlmStats = { eligible: queue.length, considered: 0, cached: 0, confirmed: 0, disagreed: 0, limited: 0, errors: 0, threshold: ctx.threshold };
  if (ctx.noLlm) {
    ctx.log(`pass 2 skipped (--no-llm) — ${queue.length} LLM-eligible cases left for a human`);
    llm.limited = queue.length;
  } else if (!ctx.haveKey || !ctx.propose) {
    ctx.log("pass 2 skipped — no OpenRouter key configured (set OPENROUTER_API_KEY to run the LLM cross-check)");
    llm.limited = queue.length;
  } else {
    await askCheap(ctx, ctx.propose, queue, llm);
  }
  return llm;
}
