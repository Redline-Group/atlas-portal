// Chart-facing selectors over MSC settlement reports: the Summary three-way
// split, bar geometry, the demand-side series, AUM rows and headline figures.
// The figures themselves are derived in settlements.ts; see
// .claude/skills/settlement-reports/SKILL.md before changing one.

import {
  SETTLEMENT_NEAR_ZERO as NEAR_ZERO,
  demandSideRevenue,
  supplyKept,
  type SettlementHeadline,
  type SettlementReport,
  type SettlementVenue,
} from "./settlements.ts";

/** Summary three-way: Sky take, supply-side kept (`par − CoF`), demand-side. */
export interface ThreeWayMonth {
  month: string;
  sky: number;
  kept: number;
  demand: number;
}

export function summaryThreeWay(report: SettlementReport): ThreeWayMonth {
  return {
    month: report.month,
    sky: report.headline.skyRevenue,
    kept: supplyKept(report),
    demand: demandSideRevenue(report.headline),
  };
}

export function threeWayPeaks(months: readonly ThreeWayMonth[]): { peakPos: number; peakNeg: number } {
  let peakPos = 0;
  let peakNeg = 0;
  for (const m of months) {
    for (const v of [m.sky, m.kept, m.demand]) {
      if (v >= 0) peakPos = Math.max(peakPos, v);
      else peakNeg = Math.max(peakNeg, -v);
    }
  }
  return { peakPos: Math.max(peakPos, 1), peakNeg };
}

export function barFillStyle(
  value: number,
  peakPos: number,
  peakNeg: number,
): { bottom: string; height: string } | null {
  const span = Math.max(1, peakPos + peakNeg);
  const zero = (peakNeg / span) * 100;
  const h = (Math.abs(value) / span) * 100;
  if (h < 0.4) return null;
  if (value >= 0) return { bottom: `${zero}%`, height: `${h}%` };
  return { bottom: `${zero - h}%`, height: `${h}%` };
}

export const DEMAND_SERIES = [
  { key: "agentRate", label: "Agent rate", barClass: "msc-bar-rate" },
  { key: "distributionRewards", label: "Distribution rewards", barClass: "msc-bar-dr" },
  { key: "gar", label: "Accessibility rewards", barClass: "msc-bar-gar" },
  { key: "chroniclePoints", label: "Chronicle points", barClass: "msc-bar-chronicle" },
] as const;

export type DemandKey = (typeof DEMAND_SERIES)[number]["key"];

export function demandPart(h: SettlementHeadline, key: DemandKey): number {
  return h[key] ?? 0;
}

export function activeDemandSeries(reports: readonly SettlementReport[]) {
  return DEMAND_SERIES.filter((s) =>
    reports.some((r) => Math.abs(demandPart(r.headline, s.key)) >= NEAR_ZERO),
  );
}

export function venuePnlCount(report: SettlementReport): number {
  return report.venues.filter(
    (v) => Math.abs(v.profitToSky) + Math.abs(v.profitToGrove) >= NEAR_ZERO,
  ).length;
}

export function hasMultiVenuePnl(report: SettlementReport): boolean {
  return venuePnlCount(report) >= 2;
}

export function hasVenueAum(report: SettlementReport): boolean {
  return report.venues.some((v) => Math.abs(v.valueEom ?? 0) >= NEAR_ZERO);
}

type AumRow = { id: string; label: string; synthetic: boolean; valueEom: number };

function aumRow(v: Pick<SettlementVenue, "id" | "label" | "synthetic" | "valueEom">): AumRow {
  return { id: v.id, label: v.label || v.id, synthetic: v.synthetic, valueEom: v.valueEom ?? 0 };
}

export function collapseAum(
  venues: readonly Pick<SettlementVenue, "id" | "label" | "synthetic" | "valueEom">[],
  topN = 12,
  minAbs = 1,
): AumRow[] {
  const kept = venues
    .map(aumRow)
    .filter((v) => Math.abs(v.valueEom) >= minAbs)
    .sort((a, b) => Math.abs(b.valueEom) - Math.abs(a.valueEom));
  if (kept.length <= topN) return kept;
  const tail = kept.slice(topN);
  const other = { id: "_other", label: `Other venues (${tail.length})`, synthetic: false, valueEom: tail.reduce((n, v) => n + v.valueEom, 0) };
  return [...kept.slice(0, topN), other];
}

export interface HeadlineFigure {
  label: string;
  value: number;
  /** A breakdown of the figure above it, not a flow of its own. */
  component?: boolean;
}

/**
 * The three ways a settled dollar can end up, plus cost of funds shown as
 * what it is: a part of Sky's take, not a fourth destination.
 *
 * Cost of funds IS the money sent to Sky — settlement-cycle derives it as
 * `sky_revenue − sde_revenue`, so the two differ only by Sky Direct
 * Exposure (zero for Obex, <0.5% for Spark, material for Grove). Listing
 * either as a peer of "To Sky" invited readers to add the row and count
 * Sky's take twice. Both render as components so Grove's remainder is
 * labeled rather than looking like a math error.
 */
export function headlineFigures(report: SettlementReport): HeadlineFigure[] {
  const { skyRevenue, cof, sdeRevenue } = report.headline;
  const rows: HeadlineFigure[] = [{ label: "To Sky", value: skyRevenue }];
  if (Math.abs(cof) >= NEAR_ZERO) {
    rows.push({ label: "of which cost of funds", value: cof, component: true });
  }
  if (Math.abs(sdeRevenue) >= NEAR_ZERO) {
    rows.push({ label: "of which Sky Direct Exposure", value: sdeRevenue, component: true });
  }
  rows.push(
    { label: "Supply kept", value: supplyKept(report) },
    { label: "Demand-side", value: demandSideRevenue(report.headline) },
  );
  return rows;
}
