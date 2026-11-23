// pass 0 — bijection: N byte-identical md docs that share ONE html predecessor duplicate-group
// (the same element used in N scopes, e.g. "Ambiguity" in Governance + Support; or a boilerplate
// doc repeated per process). #117 was a reformat, not a content addition, so each md doc almost
// certainly HAD an html predecessor — but identical content collapses them to one identity and
// drops the rest's history. The html rows in the group are identical and share one history, so any
// 1:1 assignment reconstructs identically; what matters is that they map one-to-one. Assign md docs
// (by document order) to the M identical html occurrences (by order) when N ≤ M. N > M would need
// #117 to have ADDED docs — unlikely — so those defer to review.

import { record } from "./context.ts";
import { bySubjectOrder } from "./signals.ts";
import type { Case, RunContext } from "./types.ts";

interface Group { groupCases: Case[]; addr: string; exact: boolean }
export interface BijectionResult { done: Set<string>; resolved: number; split: number; deferred: number }

const EXACT = 0.999;
const addrOf = (key: string) => key.split("#")[0];

// md content -> its seed cases
function seedGroupsByContent(ctx: RunContext): Map<string, Case[]> {
  const mdGroups = new Map<string, Case[]>();
  for (const kase of ctx.cases) {
    if (kase.kind !== "seed-close") continue;
    const content = ctx.data.nodes[kase.subjectKey]?.content;
    if (!content) continue;
    let g = mdGroups.get(content); if (!g) mdGroups.set(content, (g = [])); g.push(kase);
  }
  return mdGroups;
}

// Resolve each qualifying group's best-match html content (addr) UP FRONT, then detect CONTENTION:
// an addr that is the top match for >1 distinct md-content group means DIFFERENT documents compete
// for the same occurrences — a joint-assignment problem the per-group order heuristic gets WRONG
// (each group independently grabs occ #0, double-booking it: measured 31 collisions). Determinism
// is trustworthy ONLY for the FORCED case: an EXACT content match (score ≈ 1.0) on an UNCONTENDED
// addr, where the N identical md docs map 1:1 to the M identical html occurrences with no rival
// claimant. CONTENDED or FUZZY groups are left UNRESOLVED so the richer passes decide — the cluster
// pass does mutual-exclusion joint assignment over exactly these shared-candidate siblings (they
// connect into one cluster), then LLM/frontier. Determinism claims the obvious; the AI decides the
// ambiguous. N>M within a forced group still SPLITS the extras (created-at-#117): only M existed.
function qualifyGroups(mdGroups: Map<string, Case[]>) {
  const qualifying: Group[] = [];
  const addrGroups = new Map<string, number>(); // addr -> # of distinct md-content groups that top-match it
  for (const [, groupCases] of mdGroups) {
    if (groupCases.length < 2) continue; // a single md doc → an ordinary case
    const top = (groupCases[0].candidates || [])[0];
    if (!top || (top.score ?? 0) < 0.5) continue; // no confident content match → leave for review
    const addr = addrOf(top.key);
    qualifying.push({ groupCases, addr, exact: (top.score ?? 0) >= EXACT });
    addrGroups.set(addr, (addrGroups.get(addr) || 0) + 1);
  }
  return { qualifying, addrGroups };
}

// Thread a forced group 1:1 by document order; docs beyond the M occurrences are split copies.
function assignGroup(ctx: RunContext, { groupCases, addr }: Group, out: BijectionResult): void {
  const occKeys = [...new Set(groupCases.flatMap((k) => (k.candidates || []).filter((c) => addrOf(c.key) === addr).map((c) => c.key)))].sort();
  groupCases.slice().sort(bySubjectOrder).forEach((kase, i) => {
    if (i < occKeys.length) { record(ctx, kase, occKeys[i], "bijection"); out.resolved++; }
    else { record(ctx, kase, "none", "split"); out.split++; }
    out.done.add(kase.key);
  });
}

export function runBijectionPass(ctx: RunContext): BijectionResult {
  const out: BijectionResult = { done: new Set(), resolved: 0, split: 0, deferred: 0 };
  const { qualifying, addrGroups } = qualifyGroups(seedGroupsByContent(ctx));
  for (const group of qualifying) {
    if (!group.exact || (addrGroups.get(group.addr) || 0) > 1) { out.deferred += group.groupCases.length; continue; } // ambiguous → richer passes
    assignGroup(ctx, group, out);
  }
  if (out.resolved || out.split || out.deferred)
    ctx.log(`pass 0 (bijection + split): ${out.resolved} identical docs threaded 1:1 · ${out.split} split copies marked created-at-#117${out.deferred ? ` · ${out.deferred} contended/fuzzy → richer passes` : ""}`);
  return out;
}
