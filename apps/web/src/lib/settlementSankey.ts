export { collapseVenues } from "./settlementSankeyVenues";
import { NODE_W, PAD, buildFlows, buildLinks, buildSinkBars, spanOf } from "./settlementSankeyBuild";

export interface SankeyVenue {
  id: string;
  label: string;
  synthetic: boolean;
  profitToSky: number;
  profitToGrove: number;
}

export interface SankeyNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: "venue" | "sky" | "prime";
  /**
   * Sink nodes only: whether this bar is what arrived or what went back out to
   * loss-making venues. The two are separate bars so each one's length is its
   * own gross figure — netting them inside one bar made a bar whose length
   * matched no number on the page.
   */
  flow?: "in" | "out";
  /**
   * Baseline for this node's label. Starts at the node's vertical centre and is
   * pushed down only as far as it takes to clear the label above it — a stack
   * of near-zero-height nodes would otherwise pile every label on one line.
   */
  labelY: number;
}

export interface SankeyLink {
  from: string;
  to: string;
  value: number;
  signed: number;
  path: string;
}

export interface SankeyLayout {
  width: number;
  height: number;
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const MIN_PX = 1.5;
// Gutters are separate because the two sides carry different text: venue names
// on the left, a name + a running total on the right.
export const LEFT_GUTTER = 190;
export const RIGHT_GUTTER = 118;
// Flow band height. Deliberately short: the venue table below carries the exact
// figures, so the chart's job is proportion at a glance — and the two have to be
// readable on one screen. Label separation (not this) sets the floor on height.
export const INNER_H = 150;
export const WIDTH = 860;
// Minimum label baseline separation: one line on the left, name + total on the right.
const LABEL_LINE = 11;
// Sink labels are two lines (name + figure); an out-bar's is two as well
// (what went out, then the net the pair settles to).
const SINK_LABEL_BLOCK = 24;

// Every ribbon is floored so the smallest venues stay visible at all. That
// floor is why NOTHING here may be sized from a proportional total: a dozen
// floored ribbons stack taller than the exact share they represent, and the
// bar they dock into overflowed by up to 6px. Nodes are sized FROM the
// ribbons instead — bar length is the sum of what docks to it, by
// construction, on both sides of the chart.
function flowsOf(venues: readonly SankeyVenue[]) {
  const leftSum = venues.reduce((t, v) => t + Math.abs(v.profitToSky) + Math.abs(v.profitToGrove), 0);
  if (leftSum <= 0) return [];
  const px = INNER_H / leftSum;
  return buildFlows(venues, (v) => Math.max(MIN_PX, v * px));
}

function columnBottom(ns: SankeyNode[]) {
  return ns.reduce((t, n) => Math.max(t, n.y + n.height), 0);
}

export function layoutVenueSankey(
  venues: readonly SankeyVenue[],
  primeLabel = "Prime",
  width = WIDTH,
): SankeyLayout {
  const flows = flowsOf(venues);
  if (flows.length === 0) return { width, height: 0, nodes: [], links: [] };

  const rightX = width - RIGHT_GUTTER - NODE_W;
  const venueItems = venues.map((v) => ({
    id: v.id,
    label: v.label,
    kind: "venue" as const,
    h: spanOf(flows, (f) => f.from, v.id),
  }));
  const leftNodes = stack(venueItems, LEFT_GUTTER, LABEL_LINE);
  const rightNodes = stack(buildSinkBars(flows, primeLabel), rightX, SINK_LABEL_BLOCK);
  const nodes: SankeyNode[] = [...leftNodes, ...rightNodes];

  // A pushed-down label can outrun its column, so the box has to cover both.
  const lowestLabel = Math.max(...nodes.map((n) => n.labelY + SINK_LABEL_BLOCK / 2));
  const height = Math.max(columnBottom(leftNodes), columnBottom(rightNodes), lowestLabel) + 8;

  return { width, height, nodes, links: buildLinks(flows, leftNodes, rightNodes, LEFT_GUTTER + NODE_W, rightX) };
}

type StackItem = {
  id: string;
  label: string;
  kind: SankeyNode["kind"];
  h: number;
  flow?: "in" | "out";
  gap?: number;
};

function nodeAt(it: StackItem, x: number, y: number, labelY: number): SankeyNode {
  const { id, label, kind, h: height } = it;
  return { id, label, x, y, width: NODE_W, height, kind, labelY, ...(it.flow ? { flow: it.flow } : {}) };
}

function stack(items: StackItem[], x: number, minLabelGap: number): SankeyNode[] {
  let y = 4;
  let prevLabel = -Infinity;
  return items.map((it, i) => {
    if (i > 0) y += it.gap ?? PAD;
    prevLabel = Math.max(y + it.h / 2, prevLabel + minLabelGap);
    const n = nodeAt(it, x, y, prevLabel);
    y += it.h;
    return n;
  });
}
