import type { FlatEntry } from "@/lib/atlasHelpers";
import { descendantRun, entryDepth, type RowSpan, type VisualTree } from "../../lib/visualTree";
import { DEFAULT_RUNG, flatRung, type Rung } from "./subtreeState";

/** One reader row, before it becomes a CollapsibleNode. */
export interface ReaderRow {
  entry: FlatEntry;
  /** Docs were filtered out between this row and the one before it. */
  gap: boolean;
  /** Left rail under the selected node; "foot" closes it on the last row. */
  cradle?: "line" | "foot";
  rung: Rung;
  hasChildren: boolean;
  gatedCount: number;
  isExiting?: boolean;
}

export interface ReaderRowList {
  rows: ReaderRow[];
  /** The selected node's color, when it has a cradle. */
  cradleColor?: string;
  /** Row span of the selected node + its cradle; null when it has no row. */
  group: RowSpan | null;
}

function cradleMark(run: RowSpan | null, pos: number, isFoot: boolean): ReaderRow["cradle"] {
  if (!run || pos < run.start || pos > run.end) return undefined;
  return isFoot ? "foot" : "line";
}

type Kept = { entry: FlatEntry; i: number; gap: boolean };

// A flat subset in document order. Between two kept docs that are NOT adjacent
// in the full atlas order (something was filtered out between them), `gap`
// asks for an ellipsis barrier so the gap reads as intentional rather than as
// true neighbors.
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
  /** Docs with a descendant in the filter set (ancestorsOfMatches). */
  parentIds: ReadonlySet<string>;
  rung: ReadonlyMap<string, Rung>;
  selectedId: string | null;
  /** False in the changed-only preview, which draws no cradle. */
  cradle: boolean;
}

// The flat filtered list (selected-only / changed-only) is built purely from
// filterSet — rung state is a hierarchy-view concept that must NOT gate
// VISIBILITY here, or a matching doc that happens to sit under a collapsed
// ancestor would silently vanish from the subset (e.g. changed docs omitted so
// a review looks complete when it isn't). gatedCount is fixed at 0 — a real
// "N hidden" tab here would mutate rung state with no visible effect in this
// view. The rung, unlike visibility, DOES read the real rung map: the pendulum
// still writes it from this view, so the chevron's displayed angle/label must
// track what a click actually does. flatRung clamps level 0 to its display
// stand-in (1): 0 is invisible in this flat view, so showing its "hidden"
// glyph/angle would read as a dead click.
//
// Cradle: the selected node's descendants that survive the filter get the rail
// — even when non-contiguous (docs filtered out between them). The flat list's
// adjacency says nothing here, so the selected node's descendant span is taken
// in the FULL flatNodes (a contiguous deeper run in DFS order) and kept rows
// whose original index falls inside it are marked; the last such row gets the
// closing foot. The group spans the selected node + its cradle rows.
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

// The hierarchy view. Row visibility comes from one source — hiddenNodeIds,
// computed from the rung map — plus the rows on their way out, which keep
// rendering (marked, inert, fading) for EXIT_MS so a collapse dissolves instead
// of blinking. They are gone from the DOM for real once the timer clears.
//
// Cradle: the selected node's visible descendants are the contiguous run of
// deeper entries right after it (flatNodes is DFS document order). They get a
// left rail in the selected node's color, closed under the last one by a
// curved foot. With no visible descendants the group is just the selected node.
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
