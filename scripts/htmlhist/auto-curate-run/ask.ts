// The per-document ask loop the cheap (pass 2) and frontier (pass 3) passes share: reuse cached
// answers, cap the new asks, then ask the rest under bounded concurrency.
//
// resume cache (plan §10.4): prior LLM/frontier asks keyed `${pass}|${caseKey}` → {chosenKey,
// why, model}. A capped run REUSES earlier results (no re-spend) and spends the cap only on
// NEW cases, so the frontier can be completed in batches across sessions/deploys. Mutated in
// place + returned for the caller to persist. Per-entry model → a model change re-asks; the
// caseKey is content-addressed, so the cache stays valid as long as the queue is unchanged.

import { mapPool } from "../../../src/server/pool.ts";
import { noteError } from "./context.ts";
import { enrichCandidates, enrichSubject } from "./rules.ts";
import type { AskEntry, Case, Propose, RunContext } from "./types.ts";

export interface AskStats { considered: number; cached: number; errors: number; limited: number }

// One ask pass: which cache namespace and model it uses, and what it does with an answer.
export interface AskPass<T extends { kase: Case }> {
  name: "cheap" | "frontier";
  label: string; // names the pass in error lines
  model: string | null;
  concurrency: number;
  stats: AskStats;
  propose: Propose;
  apply(item: T, chosenKey: string, why: string): void;
  progress(): string;
}

const ckey = (pass: string, caseKey: string) => `${pass}|${caseKey}`;

// The file behind the cache is untyped JSON; an entry under an ask key is read as an ask entry.
function cacheGet(ctx: RunContext, pass: string, caseKey: string, model: string | null): AskEntry | null {
  const c = ctx.cache.get(ckey(pass, caseKey)) as AskEntry | undefined;
  return c && c.model === model ? c : null;
}

// Apply every cached answer (no re-spend) and return the items still to ask.
export function applyCached<T extends { kase: Case }>(ctx: RunContext, pass: AskPass<T>, items: T[]): T[] {
  const uncached: T[] = [];
  for (const item of items) {
    const c = cacheGet(ctx, pass.name, item.kase.key, pass.model);
    if (c) { pass.apply(item, c.chosenKey, c.why); pass.stats.cached++; } else uncached.push(item);
  }
  return uncached;
}

// The first `limit` uncached items; the overflow is counted as limited and left for a later run.
export function capAsks<T>(uncached: T[], limit: number, stats: AskStats): T[] {
  const toAsk = uncached.slice(0, Number.isFinite(limit) ? limit : uncached.length);
  stats.limited = uncached.length - toAsk.length;
  return toAsk;
}

// Ask the model about each item, caching and applying every answer. A failed ask is counted and
// leaves its case residual; an item whose subject or candidates are missing is skipped.
export async function askAll<T extends { kase: Case }>(ctx: RunContext, pass: AskPass<T>, toAsk: T[]): Promise<void> {
  let done = 0;
  await mapPool(toAsk, pass.concurrency, async (item) => {
    const { kase } = item;
    const subject = enrichSubject(kase.subjectKey, ctx.data.nodes);
    const candidates = enrichCandidates(kase, ctx.data.nodes, ctx.claimIndex);
    if (!subject || !candidates.length) return;
    pass.stats.considered++;
    try {
      // A pass with no model passes `null`, which a proposer reads as "no override", as it does `undefined`.
      const model = pass.model as string | undefined;
      const { chosenKey, why } = await pass.propose(subject, candidates, { model, change: ctx.changeBySha.get(kase.newerSha) });
      ctx.cache.set(ckey(pass.name, kase.key), { chosenKey, why, model: pass.model });
      pass.apply(item, chosenKey, why);
    } catch (e) {
      noteError(ctx.log, pass.stats, pass.label, kase.key, e);
    }
    if (++done % 25 === 0) ctx.log(`  …${done}/${toAsk.length} asked (${pass.progress()})`);
  });
}
