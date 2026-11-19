import type { SankeyLink, SankeyNode, SankeyVenue } from "./settlementSankey";

export const NODE_W = 12;
// PAD keeps single-line venue labels off each other: consecutive label
// centres are at least PAD apart however thin the nodes get.
export const PAD = 11;
// A sink's out-bar hugs its in-bar, so the pair reads as one sink.
const PAIR_PAD = 4;

export type Flow = {
  from: string;
  sink: string;
  signed: number;
  to: string;
  value: number;
  t: number;
};

// One bar per DIRECTION, not per sink: gains and losses are drawn separately
// so every bar's length is its own gross figure. (Drawing Σ|x| in a single
// bar made losses lengthen the bar they should shorten — 69% overlong for
// Spark, and a fat positive bar for months whose net was negative.)
export function buildFlows(venues: readonly SankeyVenue[], hOf: (v: number) => number): Flow[] {
  return venues.flatMap((v) =>
    [
      { from: v.id, sink: "sky", signed: v.profitToSky },
      { from: v.id, sink: "prime", signed: v.profitToGrove },
    ]
      .filter((f) => Math.abs(f.signed) >= 1e-9)
      .map((f) => ({
        ...f,
        to: f.signed < 0 ? `${f.sink}-out` : f.sink,
        value: Math.abs(f.signed),
        t: hOf(Math.abs(f.signed)),
      })),
  );
}

export function spanOf(flows: Flow[], pick: (f: Flow) => string, id: string): number {
  return flows.reduce((t, f) => (pick(f) === id ? t + f.t : t), 0);
}

export function buildSinkBars(flows: Flow[], primeLabel: string) {
  return [
    { id: "sky", label: "Sky", kind: "sky" as const },
    { id: "prime", label: primeLabel, kind: "prime" as const },
  ].flatMap((b) => {
    const inH = spanOf(flows, (f) => f.to, b.id);
    const outH = spanOf(flows, (f) => f.to, `${b.id}-out`);
    return [
      ...(inH > 0 ? [{ ...b, flow: "in" as const, h: inH, gap: PAD }] : []),
      ...(outH > 0
        ? [{ ...b, id: `${b.id}-out`, flow: "out" as const, h: outH, gap: inH > 0 ? PAIR_PAD : PAD }]
        : []),
    ];
  });
}

// Each ribbon docks at the next free offset of its venue bar and its sink bar.
export function buildLinks(
  flows: Flow[],
  leftNodes: SankeyNode[],
  rightNodes: SankeyNode[],
  x0: number,
  rightX: number,
): SankeyLink[] {
  const leftCursor = new Map(leftNodes.map((n) => [n.id, n.y]));
  const rightCursor = new Map(rightNodes.map((n) => [n.id, n.y]));
  return flows.map((f) => {
    const y0 = leftCursor.get(f.from)!;
    const y1 = rightCursor.get(f.to)!;
    leftCursor.set(f.from, y0 + f.t);
    rightCursor.set(f.to, y1 + f.t);
    return {
      from: f.from,
      to: f.to,
      value: f.value,
      signed: f.signed,
      path: ribbon(x0, y0, f.t, rightX, y1, f.t),
    };
  });
}

function ribbon(x0: number, y0: number, t0: number, x1: number, y1: number, t1: number): string {
  const cx = (x0 + x1) / 2;
  const y0b = y0 + t0;
  const y1b = y1 + t1;
  return `M${x0},${y0} C${cx},${y0} ${cx},${y1} ${x1},${y1} L${x1},${y1b} C${cx},${y1b} ${cx},${y0b} ${x0},${y0b} Z`;
}
