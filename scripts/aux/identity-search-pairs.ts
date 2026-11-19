// Pair shapes and snapshot helpers for identity-search-vector.ts.

import { planEmbedRows, shippedPolicy } from "../../src/server/retrieval/embed-rows.ts";
import { SHORT_BODY_MAX_LINES } from "../../src/server/preview/identity.ts";
import { lineCount, quantile, type HistoryNode } from "./identity-corpus.ts";

// `anchors` holds every document whose stored text is NOT simply its own title
// and body: a group anchor, and also a unit of one that carries a breadcrumb or
// key:value form. A document can enter or leave that set between two commits,
// and the two vectors are then texts of different shapes.
export type Node = HistoryNode;
export interface World { byId: Map<string, Node>; stored: Map<string, string>; anchors: Set<string> }

/** A snapshot as search would see it: every document's node, and the text
 *  stored under its id. The rows are production's own (planEmbedRows), so the
 *  script and the preview build agree on which documents are stored as a group. */
export function world(byId: Map<string, Node>): World {
  const { rows } = planEmbedRows([...byId.values()] as any, shippedPolicy());
  return {
    byId,
    stored: new Map(rows.map((r) => [r.id, r.text])),
    anchors: new Set(rows.filter((r) => !r.plain).map((r) => r.id)),
  };
}

export interface Pair {
  group: "retitle" | "sibling" | "unrelated";
  band: "short" | "mid" | "long";
  anchor: boolean;
  shapeChanged: boolean;
  oldTitle: string; newTitle: string;
  bodyA: string; bodyB: string; searchA: string; searchB: string;
  bodyTest: boolean; // bodyWhollyReplaced, the shipped body test
  gate: boolean; // the whole shipped gate (retitles only)
  note: string;
  body: number; search: number;
  word: number; line: number;
}

export const band = (t: string): Pair["band"] => { const n = lineCount(t); return n <= SHORT_BODY_MAX_LINES ? "short" : n <= 20 ? "mid" : "long"; };

export const med = (xs: number[]) => (xs.length ? quantile(xs, 0.5).toFixed(3) : "n/a");
export const qs = (xs: number[]) => (xs.length ? [0.05, 0.25, 0.5, 0.75, 0.95].map((p) => quantile(xs, p).toFixed(3)).join("  ") : "n/a");
export const pct = (n: number, d: number) => (d ? `${((100 * n) / d).toFixed(1)}%` : "n/a");
export const rule = (w: number) => "-".repeat(w);

