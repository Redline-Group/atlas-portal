// view=aggregate: the only CROSS-prime, multi-month view. Everything else is
// either one prime (month/series/venues) or one month (compare), so this is
// where "top venues across the ecosystem" and "total to Sky this year" get an
// answer.
//
// Two accounting rules govern every number in it; both are load-bearing and
// both are easy to get wrong by summing the convenient column (see
// .claude/skills/settlement-reports/SKILL.md):
//   1. Supply-side revenue is `prime_agent_revenue − cof` (supplyKept), NEVER
//      Σ per-venue profit_to_grove. The venue sum silently drops non-venue
//      revenue and spread reimbursement — a $7.29M gap across published
//      workbooks, ALL of it Spark, invisible on every other prime.
//   2. Cost of funds is not a fourth flow: it is a COMPONENT of To Sky
//      (cof + sde = skyRevenue), so it is nested under to_sky_components and
//      never emitted as a peer of to_sky/supply_kept/demand_side, or a reader
//      adds them and counts Sky's take twice.

import type { SettlementReport } from "../../lib/settlements.ts";
import { ecosystemTotals, monthTotals, primeTotals } from "./msc-aggregate-totals.ts";
import { topVenues } from "./msc-aggregate-venues.ts";
import { byMetricDesc, metricOf, sumOf, venueGapTrap, venueRevenue } from "./msc-flows.ts";
import { NOT_NET_REVENUE, workbookSource, wrap, type MscView, type MscViewArgs, type MscViewContext } from "./msc-view-kit.ts";

// Same ceiling as series — bounds the payload.
const MAX_MONTHS = 24;

function selectMonths(all: string[], { from, to, month }: MscViewArgs): string[] {
  if (from || to) return all.filter((m) => (!from || m >= from) && (!to || m <= to));
  if (month === "all") return all; // every published month — "which month was biggest", "over time"
  if (month && month !== "latest") return all.filter((m) => m === month);
  const latest = all[all.length - 1];
  return latest ? [latest] : [];
}

type MonthRow = ReturnType<typeof monthTotals>[number];

function aggregateTraps(reports: readonly SettlementReport[], byMonth: readonly MonthRow[]): string[] {
  const traps = [
    NOT_NET_REVENUE,
    "supply_kept is prime agent revenue minus cost of funds, per prime, then summed. It is NOT the sum of per-venue Profit to Grove — that basis drops non-venue revenue and spread reimbursement.",
    "cost of funds is a component of to_sky (cof + sde = to_sky), not a fourth flow. Do not add it to to_sky.",
    "value_eom_latest is an end-of-month balance from the newest month counted, not a sum across months.",
    ...venueGapTrap(
      sumOf(reports, venueRevenue),
      sumOf(reports, (r) => r.headline.primeAgentRevenue),
      "Rank venues by these rows, but never total them into a headline.",
    ),
  ];
  if (new Set(byMonth.map((m) => m.primes_reported)).size > 1) {
    traps.push(
      `Months in this range have different numbers of published workbooks (${byMonth.map((m) => `${m.month}: ${m.primes_reported}`).join(", ")}). A month with more primes reporting is not a like-for-like maximum — say which primes are counted when ranking months.`,
    );
  }
  return traps;
}

function buildAggregate({ bundle, args, view }: MscViewContext): Record<string, unknown> {
  const all = [...new Set(bundle.reports.map((r) => r.month))].sort();
  const months = selectMonths(all, args).slice(-MAX_MONTHS);
  const reports = bundle.reports.filter((r) => months.includes(r.month));
  if (reports.length === 0) {
    return wrap([], { view, error: "no published workbooks in that range", months_available: all });
  }
  const metric = metricOf(args);
  const primeRows = primeTotals(reports).sort(byMetricDesc(metric));
  const byMonth = monthTotals(months, reports);
  return wrap(reports.map(workbookSource), {
    view,
    months,
    // Always present, not only on the empty-range error: a caller that asked
    // for the default (latest month) learns here that earlier months exist
    // and can widen with month:"all" or from/to on the next round.
    months_available: all,
    primes: primeRows.map((r) => r.prime),
    metric,
    by_prime: primeRows,
    by_month: byMonth,
    ecosystem: ecosystemTotals(primeRows, reports),
    top_venues: topVenues(reports),
    traps: aggregateTraps(reports, byMonth),
  });
}

export const aggregateView = { name: "aggregate", build: buildAggregate } as const satisfies MscView;
