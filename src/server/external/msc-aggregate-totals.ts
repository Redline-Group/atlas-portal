import { pushTo } from "../../lib/collections.ts";
import type { SettlementReport } from "../../lib/settlements.ts";
import { componentsOf, flowsOf, sumFlows, sumOf, type MscFlows } from "./msc-flows.ts";

function toSkyComponents(reports: readonly SettlementReport[]): Record<string, number> {
  return componentsOf(sumOf(reports, (r) => r.headline.cof), sumOf(reports, (r) => r.headline.sdeRevenue));
}

export function primeTotals(reports: readonly SettlementReport[]) {
  const byPrime = new Map<string, SettlementReport[]>();
  for (const r of reports) pushTo(byPrime, r.prime, r);
  return [...byPrime].map(([prime, rs]) => ({
    prime,
    months: rs.map((r) => r.month).sort(),
    ...sumFlows(rs.map(flowsOf)),
    to_sky_components: toSkyComponents(rs),
  }));
}

// primes_reported travels with each row: a month with fewer published workbooks is not comparable on its face.
export function monthTotals(months: readonly string[], reports: readonly SettlementReport[]) {
  return months.map((month) => {
    const rs = reports.filter((r) => r.month === month);
    return { month, ...sumFlows(rs.map(flowsOf)), primes_reported: rs.length };
  });
}

// foot_delta re-checks cof + sde = skyRevenue on the aggregate so a basis regression shows in the payload.
export function ecosystemTotals(primeRows: readonly MscFlows[], reports: readonly SettlementReport[]) {
  const eco = sumFlows(primeRows);
  const par = sumOf(reports, (r) => r.headline.primeAgentRevenue);
  const sde = sumOf(reports, (r) => r.headline.sdeRevenue);
  return {
    ...eco,
    prime_agent_revenue: par,
    to_sky_components: toSkyComponents(reports),
    // (skyRevenue + supplyKept + demand) must equal (par + demand + sde).
    foot_delta: eco.to_sky + eco.supply_kept + eco.demand_side - (par + eco.demand_side + sde),
  };
}
