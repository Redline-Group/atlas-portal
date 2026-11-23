// pass 3 — frontier escalation: lock only on agreement with an independent signal (never the cheap LLM), else hint.

import { applyCached, askAll, capAsks, type AskPass, type AskStats } from "./ask.ts";
import { record } from "./context.ts";
import { frontierCorroborator, frontierTriggers } from "./rules.ts";
import { containBestKey } from "./signals.ts";
import type { Case, HtmlCommit, Propose, RunContext } from "./types.ts";

export interface FrontierStats extends AskStats { eligible: number; locked: number; hints: number; model: string | null }
interface Escalation { kase: Case; fwdKey: string | null; containKey: string | null }

function frontierEligible(ctx: RunContext): Escalation[] {
  const done = new Set(ctx.decisions.map((d) => d.caseKey));
  const eligible: Escalation[] = [];
  for (const kase of ctx.cases) {
    if (done.has(kase.key)) continue;
    const fwdKey = ctx.links.get(kase.key) ?? null;
    const containKey = ctx.containment ? containBestKey(ctx.data, kase) : null;
    const triggers = frontierTriggers(kase, { fwdKey, containKey, cheapKey: ctx.cheapPicks.get(kase.key) });
    if (triggers.size) eligible.push({ kase, fwdKey, containKey });
  }
  return eligible;
}

function applyFrontier(ctx: RunContext, front: FrontierStats, { kase, fwdKey, containKey }: Escalation, chosenKey: string, why: string): void {
  const corroborator = frontierCorroborator(chosenKey, { autoKey: kase.autoKey, fwdKey, containKey });
  if (corroborator) { record(ctx, kase, chosenKey, "frontier", why, { corroborator }); front.locked++; }
  else { ctx.proposals.push({ caseKey: kase.key, chosenKey, why }); front.hints++; }
}

// Hardest-first so a --frontier-limit spends on the trickiest uncached cases.
function sortHardestFirst(uncached: Escalation[], commits: HtmlCommit[]): void {
  const rank = new Map(commits.map((c, i) => [c.sha, i]));
  uncached.sort((a, b) =>
    (a.kase.kind === "seed-close" ? 0 : 1) - (b.kase.kind === "seed-close" ? 0 : 1) ||
    (rank.get(b.kase.newerSha) ?? -1) - (rank.get(a.kase.newerSha) ?? -1));
}

async function askFrontier(ctx: RunContext, propose: Propose, front: FrontierStats): Promise<void> {
  const eligible = frontierEligible(ctx);
  front.eligible = eligible.length;
  const pass: AskPass<Escalation> = {
    name: "frontier", label: "frontier", model: ctx.frontierModel, concurrency: ctx.frontierConcurrency, stats: front, propose,
    apply: (item, chosenKey, why) => applyFrontier(ctx, front, item, chosenKey, why),
    progress: () => `${front.locked} locked, ${front.hints} hints`,
  };
  const uncached = applyCached(ctx, pass, eligible);
  sortHardestFirst(uncached, ctx.commits);
  const toAsk = capAsks(uncached, ctx.frontierLimit, front);
  ctx.log(`pass 3 (frontier ${ctx.frontierModel}): ${front.cached} cached · asking ${toAsk.length}/${uncached.length} new (concurrency ${ctx.frontierConcurrency})…`);
  await askAll(ctx, pass, toAsk);
  ctx.log(`pass 3 (frontier): ${front.locked} locked · ${front.hints} hints · ${front.cached} cached · ${front.errors} errors`);
}

export async function runFrontierPass(ctx: RunContext): Promise<FrontierStats> {
  const front: FrontierStats = { eligible: 0, considered: 0, cached: 0, locked: 0, hints: 0, errors: 0, limited: 0, model: ctx.frontier ? ctx.frontierModel : null };
  if (ctx.frontier && !ctx.noLlm && ctx.haveKey && ctx.propose) await askFrontier(ctx, ctx.propose, front);
  return front;
}
