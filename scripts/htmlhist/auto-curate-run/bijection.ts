// pass 0 — bijection: N identical md docs sharing one html duplicate-group map 1:1 by document order (N > M defers to review).

import { record } from "./context.ts";
import { bySubjectOrder } from "./signals.ts";
import type { Case, RunContext } from "./types.ts";

interface Group { groupCases: Case[]; addr: string; exact: boolean }
export interface BijectionResult { done: Set<string>; resolved: number; split: number; deferred: number }

const EXACT = 0.999;
const addrOf = (key: string) => key.split("#")[0];

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

// Only an EXACT match on an UNCONTENDED addr is forced; an addr top-matched by >1 md-content group
// would be double-booked by the per-group order heuristic, so contended/fuzzy groups go to richer passes.
function qualifyGroups(mdGroups: Map<string, Case[]>) {
  const qualifying: Group[] = [];
  const addrGroups = new Map<string, number>();
  for (const [, groupCases] of mdGroups) {
    if (groupCases.length < 2) continue;
    const top = (groupCases[0].candidates || [])[0];
    if (!top || (top.score ?? 0) < 0.5) continue;
    const addr = addrOf(top.key);
    qualifying.push({ groupCases, addr, exact: (top.score ?? 0) >= EXACT });
    addrGroups.set(addr, (addrGroups.get(addr) || 0) + 1);
  }
  return { qualifying, addrGroups };
}

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
    if (!group.exact || (addrGroups.get(group.addr) || 0) > 1) { out.deferred += group.groupCases.length; continue; }
    assignGroup(ctx, group, out);
  }
  if (out.resolved || out.split || out.deferred)
    ctx.log(`pass 0 (bijection + split): ${out.resolved} identical docs threaded 1:1 · ${out.split} split copies marked created-at-#117${out.deferred ? ` · ${out.deferred} contended/fuzzy → richer passes` : ""}`);
  return out;
}
