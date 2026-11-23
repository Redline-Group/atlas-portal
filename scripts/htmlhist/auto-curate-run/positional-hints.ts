// Advisory positional hints for the residual, gated on ancestor AND neighbour agreeing; never a lock.

import { positionalSelfCorroborates } from "./rules.ts";
import { positionalPickFor } from "./signals.ts";
import type { Case, RunContext } from "./types.ts";

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
