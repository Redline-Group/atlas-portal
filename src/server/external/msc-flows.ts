// Shared MSC accounting: three flows per cycle, cost of funds nested under To Sky, venue rows never totalled into a headline.

import { SETTLEMENT_NEAR_ZERO as NEAR_ZERO, type SettlementReport } from "../../lib/settlements.ts";
import { summaryThreeWay } from "../../lib/settlementCharts.ts";
import type { MscViewArgs } from "./msc-view-kit.ts";

export const MSC_METRICS = ["to_sky", "supply_kept", "demand_side", "cof"] as const;
export type MscMetric = (typeof MSC_METRICS)[number];

export interface MscFlows {
  to_sky: number;
  supply_kept: number;
  demand_side: number;
}

export function sumOf<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((n, item) => n + pick(item), 0);
}

// supply_kept is par − cof, never Σ profit_to_grove.
export function flowsOf(report: SettlementReport): MscFlows {
  const { sky, kept, demand } = summaryThreeWay(report);
  return { to_sky: sky, supply_kept: kept, demand_side: demand };
}

export function sumFlows(rows: readonly MscFlows[]): MscFlows {
  return {
    to_sky: sumOf(rows, (r) => r.to_sky),
    supply_kept: sumOf(rows, (r) => r.supply_kept),
    demand_side: sumOf(rows, (r) => r.demand_side),
  };
}

// cof + sde = skyRevenue, so both nest UNDER to_sky: cost of funds is not a fourth flow,
// and a flat `cof` sibling invites adding it, nearly doubling Sky's take.
export function componentsOf(cof: number, sde: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (Math.abs(cof) >= NEAR_ZERO) out.cof = cof;
  if (Math.abs(sde) >= NEAR_ZERO) out.sde = sde;
  return out;
}

export function metricOf(args: MscViewArgs): MscMetric {
  return (MSC_METRICS.includes(args.metric as MscMetric) ? args.metric : "to_sky") as MscMetric;
}

type RankedRow = MscFlows & { to_sky_components: Record<string, number> };

// cof ranks by the nested component; falling back to to_sky would only look right (they differ by SDE).
export function byMetricDesc(metric: MscMetric): (a: RankedRow, b: RankedRow) => number {
  const rank = (r: RankedRow) => (metric === "cof" ? (r.to_sky_components.cof ?? 0) : r[metric]);
  return (a, b) => Math.abs(rank(b)) - Math.abs(rank(a));
}

export function venueRevenue(report: SettlementReport): number {
  return sumOf(report.venues, (v) => v.revenueToPrime);
}

export function venueGapTrap(venueSum: number, primeAgentRevenue: number, advice: string): string[] {
  const gap = Math.abs(venueSum - primeAgentRevenue);
  if (!(gap >= NEAR_ZERO)) return [];
  return [
    `Venue revenue rows sum $${Math.round(venueSum)} against headline prime agent revenue $${Math.round(primeAgentRevenue)} (gap $${Math.round(gap)}). ${advice}`,
  ];
}
