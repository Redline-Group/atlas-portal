import { revenueGap, type SettlementReport, type SettlementVenue } from "../../lib/settlements.ts";
import { collapseAum } from "../../lib/settlementCharts.ts";
import { workbookUrl } from "./envelope.ts";
import { sumOf, venueRevenue } from "./msc-flows.ts";
import { forumSources, workbookSource, wrap, type ForumHit, type MscView, type MscViewContext } from "./msc-view-kit.ts";
import { forReport } from "./msc-view-prime.ts";

const TOP_VENUES = 12;

function venueRow(v: SettlementVenue) {
  return {
    id: v.id,
    label: v.label,
    chain: v.chain,
    revenue_to_prime: v.revenueToPrime,
    cof_alloc: v.cofAlloc,
    profit_to_sky: v.profitToSky,
    profit_to_grove: v.profitToGrove,
    value_eom: v.valueEom ?? 0,
  };
}

type VenueRow = ReturnType<typeof venueRow>;

const profitMagnitude = (v: VenueRow) => Math.abs(v.profit_to_grove) + Math.abs(v.profit_to_sky);

function otherRow(tail: VenueRow[]): VenueRow {
  return {
    id: "_other",
    label: `Other venues (${tail.length})`,
    chain: "",
    revenue_to_prime: sumOf(tail, (v) => v.revenue_to_prime),
    cof_alloc: sumOf(tail, (v) => v.cof_alloc),
    profit_to_sky: sumOf(tail, (v) => v.profit_to_sky),
    profit_to_grove: sumOf(tail, (v) => v.profit_to_grove),
    value_eom: sumOf(tail, (v) => v.value_eom),
  };
}

function venueRows(report: SettlementReport): VenueRow[] {
  const ranked = report.venues.map(venueRow).sort((a, b) => profitMagnitude(b) - profitMagnitude(a));
  const tail = ranked.slice(TOP_VENUES);
  return tail.length === 0 ? ranked : [...ranked.slice(0, TOP_VENUES), otherRow(tail)];
}

function buildVenues(report: SettlementReport, forum: ForumHit | null, { view }: MscViewContext): Record<string, unknown> {
  return wrap([workbookSource(report), ...forumSources(forum)], {
    view,
    cycle: { prime: report.prime, month: report.month },
    rows: venueRows(report),
    aum: collapseAum(report.venues),
    headline_vs_venue_sum: {
      venue_revenue_sum: venueRevenue(report),
      headline_prime_agent_revenue: report.headline.primeAgentRevenue,
      gap: revenueGap(report),
      note: "The venue-row sum is not supply kept and is not the Comparison-block total. Supply kept is prime agent revenue − cost of funds.",
    },
    forum,
    workbook_url: workbookUrl(report.prime, report.month),
  });
}

export const venuesView = { name: "venues", build: forReport(buildVenues) } as const satisfies MscView;
