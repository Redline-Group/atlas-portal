import type { FlatEntry } from "@/lib/atlasHelpers";
import { descendantRun, entryDepth, type RowSpan, type VisualTree } from "../../lib/visualTree";
import { DEFAULT_RUNG, flatRung, type Rung } from "./subtreeState";

export interface ReaderRow {
  entry: FlatEntry;
  gap: boolean;
  cradle?: "line" | "foot";
  rung: Rung;
  hasChildren: boolean;
  gatedCount: number;
  isExiting?: boolean;
}

export interface ReaderRowList {
  rows: ReaderRow[];
  cradleColor?: string;
  group: RowSpan | null;
}

function cradleMark(run: RowSpan | null, pos: number, isFoot: boolean): ReaderRow["cradle"] {
  if (!run || pos < run.start || pos > run.end) return undefined;
  return isFoot ? "foot" : "line";
}

type Kept = { entry: FlatEntry; i: number; gap: boolean };

function keptEntries(flatNodes: FlatEntry[], filterSet: ReadonlySet<string>): Kept[] {
  const kept: Kept[] = [];
  let prev = -1;
  flatNodes.forEach((entry, i) => {
    if (!filterSet.has(entry.node.id)) return;
    kept.push({ entry, i, gap: prev >= 0 && i - prev > 1 });
    prev = i;
  });
  return kept;
}

export interface FlatRowsInput {
  flatNodes: FlatEntry[];
  filterSet: ReadonlySet<string>;
  parentIds: ReadonlySet<string>;
  rung: ReadonlyMap<string, Rung>;
  selectedId: string | null;
  cradle: boolean;
}

// Visibility comes only from filterSet: gating on rung would silently drop matches under a collapsed ancestor.
// The cradle span is taken in the full flatNodes, since kept rows need not be contiguous.
export function flatRows(input: FlatRowsInput): ReaderRowList {
  const { flatNodes, filterSet, parentIds, rung, selectedId } = input;
  const kept = keptEntries(flatNodes, filterSet);
  const selFull = input.cradle && selectedId ? flatNodes.findIndex((e) => e.node.id === selectedId) : -1;
  const run = descendantRun(flatNodes, selFull, entryDepth);
  let lastCradleKept = -1;
  kept.forEach((k, idx) => {
    if (run && k.i >= run.start && k.i <= run.end) lastCradleKept = idx;
  });
  const rows = kept.map(({ entry, i, gap }, k) => ({
    entry,
    gap,
    cradle: cradleMark(run, i, k === lastCradleKept),
    rung: flatRung(rung.get(entry.node.id) ?? DEFAULT_RUNG),
    hasChildren: parentIds.has(entry.node.id),
    gatedCount: 0,
  }));
  const kSel = selectedId ? kept.findIndex((k) => k.entry.node.id === selectedId) : -1;
  const group = kSel < 0 ? null : { start: kSel, end: lastCradleKept >= 0 ? lastCradleKept : kSel };
  return { rows, cradleColor: run ? flatNodes[selFull].color : undefined, group };
}

export interface TreeRowsInput {
  flatNodes: FlatEntry[];
  tree: VisualTree;
  rung: ReadonlyMap<string, Rung>;
  hiddenNodeIds: ReadonlySet<string>;
  exitingIds: ReadonlySet<string>;
  selectedId: string | null;
}

// Exiting rows keep rendering for EXIT_MS so a collapse fades instead of blinking.
export function treeRows(input: TreeRowsInput): ReaderRowList {
  const { flatNodes, tree, rung, hiddenNodeIds, exitingIds, selectedId } = input;
  const visible = flatNodes.filter((e) => !hiddenNodeIds.has(e.node.id) || exitingIds.has(e.node.id));
  const selIdx = selectedId ? visible.findIndex((e) => e.node.id === selectedId) : -1;
  const run = descendantRun(visible, selIdx, entryDepth);
  const rows = visible.map((entry, idx) => {
    const r = rung.get(entry.node.id) ?? DEFAULT_RUNG;
    return {
      entry,
      gap: false,
      cradle: cradleMark(run, idx, idx === run?.end),
      rung: r,
      hasChildren: tree.children.has(entry.node.id),
      gatedCount: r.level === 0 ? tree.spanCount.get(entry.node.id) ?? 0 : 0,
      isExiting: exitingIds.has(entry.node.id),
    };
  });
  const group = selIdx < 0 ? null : { start: selIdx, end: run ? run.end : selIdx };
  return { rows, cradleColor: run ? visible[selIdx].color : undefined, group };
}
