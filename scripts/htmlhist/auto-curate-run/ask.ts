// Resume cache keyed `${pass}|${caseKey}`: a capped run reuses earlier answers and spends only on new cases; a model change re-asks.

import { mapPool } from "../../../src/server/pool.ts";
import { noteError } from "./context.ts";
import { enrichCandidates, enrichSubject } from "./rules.ts";
import type { AskEntry, Case, Propose, RunContext } from "./types.ts";

export interface AskStats { considered: number; cached: number; errors: number; limited: number }

export interface AskPass<T extends { kase: Case }> {
  name: "cheap" | "frontier";
  label: string;
  model: string | null;
  concurrency: number;
  stats: AskStats;
  propose: Propose;
  apply(item: T, chosenKey: string, why: string): void;
  progress(): string;
}

const ckey = (pass: string, caseKey: string) => `${pass}|${caseKey}`;

function cacheGet(ctx: RunContext, pass: string, caseKey: string, model: string | null): AskEntry | null {
  const c = ctx.cache.get(ckey(pass, caseKey)) as AskEntry | undefined;
  return c && c.model === model ? c : null;
}

export function applyCached<T extends { kase: Case }>(ctx: RunContext, pass: AskPass<T>, items: T[]): T[] {
  const uncached: T[] = [];
  for (const item of items) {
    const c = cacheGet(ctx, pass.name, item.kase.key, pass.model);
    if (c) { pass.apply(item, c.chosenKey, c.why); pass.stats.cached++; } else uncached.push(item);
  }
  return uncached;
}

export function capAsks<T>(uncached: T[], limit: number, stats: AskStats): T[] {
  const toAsk = uncached.slice(0, Number.isFinite(limit) ? limit : uncached.length);
  stats.limited = uncached.length - toAsk.length;
  return toAsk;
}

export async function askAll<T extends { kase: Case }>(ctx: RunContext, pass: AskPass<T>, toAsk: T[]): Promise<void> {
  let done = 0;
  await mapPool(toAsk, pass.concurrency, async (item) => {
    const { kase } = item;
    const subject = enrichSubject(kase.subjectKey, ctx.data.nodes);
    const candidates = enrichCandidates(kase, ctx.data.nodes, ctx.claimIndex);
    if (!subject || !candidates.length) return;
    pass.stats.considered++;
    try {
      // A proposer reads `null` as "no override", like `undefined`.
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
