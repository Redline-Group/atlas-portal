// The deterministic, numbers-only brief the main model reads when the sub-agent is unavailable.

interface Figure {
  name: string;
  value: number;
  unit: string;
}
type View = Record<string, unknown>;
type Row = Record<string, number | string>;

// Fits the largest view (aggregate: 3 ecosystem flows + 24 months + one row per prime) without truncating it.
const BRIEF_FIGURES_CAP = 40;

const usd = (name: string, value: number): Figure => ({ name, value, unit: "USD" });

function flowFigures(block: unknown, toSky: string, supplyKept: string, demandSide: string): Figure[] {
  const flows = block as Record<string, number> | undefined;
  if (!flows || typeof flows.to_sky !== "number") return [];
  return [usd(toSky, flows.to_sky), usd(supplyKept, flows.supply_kept), usd(demandSide, flows.demand_side)];
}

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

// aggregate keeps its money under different keys; without this section its brief would be empty.
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
