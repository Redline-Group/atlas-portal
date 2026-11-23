// positional HINTS (advisory) — for the still-residual cases the content passes + LLM
// couldn't lock (typically matcher-null identical siblings, where there is NO content
// signal to corroborate against), surface the positional pick as a suggested predecessor
// the human confirms in the curation UI. Gated on SELF-corroboration (P1 ancestor AND P2
// neighbour both independently favour the pick) to stand in for the missing content
// signal. NEVER a lock — written to the advisory proposals file only, alongside any
// frontier hints (never overwriting one already recorded for the same case).

import { positionalSelfCorroborates } from "./rules.ts";
import { positionalPickFor } from "./signals.ts";
import type { Case, RunContext } from "./types.ts";

// Appends the hints to `ctx.proposals` and returns how many it added.
export function addPositionalHints(ctx: RunContext, residual: Case[]): number {
  let posHints = 0;
  const hinted = new Set(ctx.proposals.map((p) => p.caseKey));
  for (const kase of residual) {
    if (hinted.has(kase.key)) continue;
    const pick = positionalPickFor(ctx.data, kase);
    if (positionalSelfCorroborates(pick)) {
      ctx.proposals.push({ caseKey: kase.key, chosenKey: pick.chosenKey, via: "positional", why: `positional: ancestor + neighbour agree (P1=${pick.p1.toFixed(2)}, P2=${pick.p2.toFixed(2)}, margin=${pick.margin.toFixed(2)})` });
      posHints++;
    }
  }
  if (posHints) ctx.log(`positional hints: ${posHints} advisory suggestion(s) for residual cases (curation UI, not locked)`);
  return posHints;
}
