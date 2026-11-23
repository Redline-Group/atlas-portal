// view=month: one prime's cycle as the three flows, with To Sky and
// demand-side broken into their parts.

import { SETTLEMENT_NEAR_ZERO as NEAR_ZERO, isDemandSideCycle, type SettlementReport } from "../../lib/settlements.ts";
import { demandPart, DEMAND_SERIES } from "../../lib/settlementCharts.ts";
import { workbookUrl } from "./envelope.ts";
import { componentsOf, flowsOf, venueGapTrap, venueRevenue } from "./msc-flows.ts";
import { forumSources, NOT_NET_REVENUE, THREE_WAY_NOTE, workbookSource, wrap, type ForumHit, type MscView } from "./msc-view-kit.ts";
import { forReport } from "./msc-view-prime.ts";

function demandParts(report: SettlementReport): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of DEMAND_SERIES) {
    const n = demandPart(report.headline, s.key);
    if (Math.abs(n) >= NEAR_ZERO) out[s.key] = n;
  }
  return out;
}

function buildMonth(report: SettlementReport, forum: ForumHit | null): Record<string, unknown> {
  const { cof, sdeRevenue, primeAgentRevenue } = report.headline;
  const gapTrap = venueGapTrap(venueRevenue(report), primeAgentRevenue, "Do not use Σ Profit to Grove as supply kept.");
  return wrap([workbookSource(report), ...forumSources(forum)], {
    view: "month",
    cycle: {
      prime: report.prime,
      month: report.month,
      period: report.period,
      settleVersion: report.settleVersion,
      kind: isDemandSideCycle(report) ? "demand_only" : "supply",
    },
    three_way: { ...flowsOf(report), note: THREE_WAY_NOTE },
    to_sky_components: componentsOf(cof, sdeRevenue),
    demand_parts: demandParts(report),
    traps: [NOT_NET_REVENUE, ...gapTrap],
    workbook_url: workbookUrl(report.prime, report.month),
    forum,
  });
}

export const monthView = { name: "month", build: forReport(buildMonth) } as const satisfies MscView;
