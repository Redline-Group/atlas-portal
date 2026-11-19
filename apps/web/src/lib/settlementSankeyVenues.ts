import type { SankeyVenue } from "./settlementSankey";
import type { SettlementVenue } from "./settlements";

type VenueInput = Pick<SettlementVenue, "id" | "label" | "synthetic" | "profitToSky" | "profitToGrove">;

// Venues at or above `minAbs` total magnitude, largest first.
function rankVenues(venues: readonly VenueInput[], minAbs: number): SankeyVenue[] {
  return venues
    .map((v) => ({
      id: v.id,
      label: v.label || v.id,
      synthetic: v.synthetic,
      profitToSky: v.profitToSky,
      profitToGrove: v.profitToGrove,
      mag: Math.abs(v.profitToSky) + Math.abs(v.profitToGrove),
    }))
    .filter((v) => v.mag >= minAbs)
    .sort((a, b) => b.mag - a.mag);
}

function foldVenues(tail: SankeyVenue[]): SankeyVenue {
  return {
    id: "_other",
    label: `Other venues (${tail.length})`,
    synthetic: false,
    profitToSky: tail.reduce((n, v) => n + v.profitToSky, 0),
    profitToGrove: tail.reduce((n, v) => n + v.profitToGrove, 0),
  };
}

export function collapseVenues(venues: readonly VenueInput[], topN = 12, minAbs = 1): SankeyVenue[] {
  const kept = rankVenues(venues, minAbs);
  if (kept.length <= topN) return kept;
  return [...kept.slice(0, topN), foldVenues(kept.slice(topN))];
}
