// The deterministic brief the main model reads when the sub-agent is
// unavailable — numbers only, no narrative.

interface Figure {
  name: string;
  value: number;
  unit: string;
}
type View = Record<string, unknown>;
type Row = Record<string, number | string>;

// Bounds the deterministic brief. The largest view is aggregate over the
// 24-month ceiling: 3 ecosystem flows + 24 months + one row per prime. This is
// the FALLBACK the main model reads when the sub-model contributes nothing, so
// it must not truncate the very table that answers the question (the
// sub-model's own output is capped separately in subagent.ts).
const BRIEF_FIGURES_CAP = 40;

const usd = (name: string, value: number): Figure => ({ name, value, unit: "USD" });

/** The three flows of a `three_way` or `ecosystem` block, under the given names. */
function flowFigures(block: unknown, toSky: string, supplyKept: string, demandSide: string): Figure[] {
  const flows = block as Record<string, number> | undefined;
  if (!flows || typeof flows.to_sky !== "number") return [];
  return [usd(toSky, flows.to_sky), usd(supplyKept, flows.supply_kept), usd(demandSide, flows.demand_side)];
}

/** One To Sky figure per row that carries a number. */
function toSkyFigures(rows: Row[] | undefined, name: (row: Row) => string): Figure[] {
  const out: Figure[] = [];
  for (const r of rows ?? []) {
    if (typeof r.to_sky === "number") out.push(usd(name(r), r.to_sky));
  }
  return out;
}

function threeWayFigures(view: View): Figure[] {
  return flowFigures(view.three_way, "To Sky", "Supply kept", "Demand-side");
}

function componentFigures(view: View): Figure[] {
  const comps = view.to_sky_components as Record<string, number> | undefined;
  const out: Figure[] = [];
  if (comps?.cof != null) out.push(usd("Cost of funds (of To Sky)", comps.cof));
  if (comps?.sde != null) out.push(usd("Sky Direct Exposure (of To Sky)", comps.sde));
  return out;
}

function seriesFigures(view: View): Figure[] {
  const points = view.points as Row[] | undefined;
  return toSkyFigures(points?.slice(-6), (p) => `To Sky ${p.month}`);
}

function compareFigures(view: View): Figure[] {
  const rows = view.rows as Row[] | undefined;
  if (view.view !== "compare") return [];
  return toSkyFigures(rows?.slice(0, 8), (r) => `${r.prime} To Sky`);
}

// aggregate carries its money under ecosystem / by_month / by_prime rather
// than three_way / points / rows, so it needs its own section: without one the
// fallback brief for the one cross-prime view is EMPTY — the main model sees
// source links and nothing else, and reports that the tool returned no figures.
function aggregateFigures(view: View): Figure[] {
  if (view.view !== "aggregate") return [];
  const months = Array.isArray(view.months) ? (view.months as string[]) : [];
  const span = months.length > 1 ? ` ${months[0]}..${months[months.length - 1]}` : months.length === 1 ? ` ${months[0]}` : "";
  return [
    ...flowFigures(view.ecosystem, `Ecosystem To Sky${span}`, `Ecosystem supply kept${span}`, `Ecosystem demand-side${span}`),
    ...toSkyFigures(view.by_month as Row[] | undefined, (m) => `To Sky ${m.month} (${m.primes_reported} primes)`),
    ...toSkyFigures(view.by_prime as Row[] | undefined, (r) => `${r.prime} To Sky${span}`),
  ];
}

// Figures appear in this order; a view shape with money under new keys adds a
// section here.
const SECTIONS = [threeWayFigures, componentFigures, seriesFigures, compareFigures, aggregateFigures];

export function briefFromView(view: View): Record<string, unknown> {
  return {
    source_class: view.source_class,
    not_atlas: true,
    required_disclaimer: view.required_disclaimer,
    sources: view.sources,
    figures: SECTIONS.flatMap((section) => section(view)).slice(0, BRIEF_FIGURES_CAP),
    forum: view.forum ?? null,
    workbook_url: view.workbook_url ?? null,
    notes: "",
    subagent: "skipped",
  };
}
