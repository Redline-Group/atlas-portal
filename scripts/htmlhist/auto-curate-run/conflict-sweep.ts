// Per-case passes lock in isolation and can double-book an older occurrence; keep the strongest
// claimant and demote the rest to residual rather than let apply go last-writer-wins.

import type { Decision, Log } from "./types.ts";

const TIER_RANK: Record<string, number> = { bijection: 0, cluster: 1, "forward-reverse": 2, containment: 3, positional: 4, "llm-90": 5, frontier: 6, split: 9 };

const occurrenceOf = (d: Decision) => (!d.chosenKey || d.chosenKey === "none" ? null : `${d.olderSha}|${d.chosenKey}`);

function weakerClaimants(decisions: Decision[]): Set<Decision> {
  const occClaims = new Map<string, Decision[]>();
  for (const d of decisions) {
    const k = occurrenceOf(d);
    if (!k) continue;
    let a = occClaims.get(k); if (!a) occClaims.set(k, (a = [])); a.push(d);
  }
  const demoted = new Set<Decision>();
  for (const claimants of occClaims.values()) {
    if (claimants.length < 2) continue;
    claimants.sort((x, y) => (TIER_RANK[x.auto] ?? 8) - (TIER_RANK[y.auto] ?? 8) || Number(y.agreedWithAuto) - Number(x.agreedWithAuto));
    for (const d of claimants.slice(1)) demoted.add(d);
  }
  return demoted;
}

// Must hold after resolution, else apply would silently drop histories.
function assertExclusive(decisions: Decision[]): void {
  const seen = new Set<string>();
  for (const d of decisions) {
    const k = occurrenceOf(d);
    if (!k) continue;
    if (seen.has(k)) throw new Error(`mutual-exclusion violated: older occurrence ${k} claimed by >1 decision after conflict sweep`);
    seen.add(k);
  }
}

export function sweepConflicts(decisions: Decision[], log: Log): { kept: Decision[]; demoted: number } {
  const demoted = weakerClaimants(decisions);
  const kept = demoted.size ? decisions.filter((d) => !demoted.has(d)) : decisions;
  if (demoted.size) log(`conflict sweep: demoted ${demoted.size} double-booked claim(s) to residual (kept the strongest per occurrence)`);
  assertExclusive(kept);
  return { kept, demoted: demoted.size };
}
