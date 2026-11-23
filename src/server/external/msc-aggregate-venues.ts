import type { SettlementReport, SettlementVenue } from "../../lib/settlements.ts";

const TOP_VENUES = 20;

interface VenueTotal {
  prime: string;
  id: string;
  label: string;
  chain: string;
  revenue_to_prime: number;
  profit_to_sky: number;
  profit_to_grove: number;
  value_eom: number;
  last: string;
  months: number;
}

function firstMonth(r: SettlementReport, v: SettlementVenue): VenueTotal {
  return { prime: r.prime, id: v.id, label: v.label, chain: v.chain, revenue_to_prime: v.revenueToPrime, profit_to_sky: v.profitToSky, profit_to_grove: v.profitToGrove, value_eom: v.valueEom ?? 0, last: r.month, months: 1 };
}

function addMonth(cur: VenueTotal, month: string, v: SettlementVenue): void {
  cur.revenue_to_prime += v.revenueToPrime;
  cur.profit_to_sky += v.profitToSky;
  cur.profit_to_grove += v.profitToGrove;
  cur.months += 1;
  if (month >= cur.last) {
    cur.last = month;
    cur.label = v.label;
    cur.value_eom = v.valueEom ?? 0; // stock: latest, not summed
  }
}

// Keyed by prime+id since two primes can reuse an id; flows add across months, value_eom does not.
function venueTotals(reports: readonly SettlementReport[]): VenueTotal[] {
  const byKey = new Map<string, VenueTotal>();
  for (const r of reports) {
    for (const v of r.venues) {
      const key = `${r.prime}::${v.id}`;
      const cur = byKey.get(key);
      if (cur) addMonth(cur, r.month, v);
      else byKey.set(key, firstMonth(r, v));
    }
  }
  return [...byKey.values()];
}

export function topVenues(reports: readonly SettlementReport[]) {
  return venueTotals(reports)
    .sort((a, b) => Math.abs(b.revenue_to_prime) - Math.abs(a.revenue_to_prime))
    .slice(0, TOP_VENUES)
    .map((v) => ({ prime: v.prime, id: v.id, label: v.label, chain: v.chain, revenue_to_prime: v.revenue_to_prime, profit_to_sky: v.profit_to_sky, profit_to_grove: v.profit_to_grove, value_eom_latest: v.value_eom, months_counted: v.months }));
}
