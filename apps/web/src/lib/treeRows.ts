import { realDepth, depthColor } from "@/lib/depth";
import type { AtlasBundle } from "./docs";
import type { ParentIndex } from "./treeExpansion";
import { descendantRun } from "./visualTree";
import { buildSelectedOnlyNodes, selectedDescendantRunEnd } from "./selectedTree";
import type { TreeRowData, VisibleNode } from "../components/tree/TreeRow";

// "Changed only" (preview): a flat list of just the changed docs, in document
// order — no hierarchy, nothing to expand.
function changedOnlyRows(docs: AtlasBundle["docs"], changedSet: Set<string>): VisibleNode[] {
  return Object.values(docs)
    .filter((n) => changedSet.has(n.id))
    .sort((a, b) => a.order - b.order)
    // Use the node's real depth (not a flat 1) so chiclet colors — and NR-X
    // chiclets in particular, whose number is colored by this depth — match
    // the reader instead of all rendering as depth-1 red.
    .map((node) => ({ node, hasChildren: false, treeDepth: node.depth }));
}

// The full tree in DFS document order, descending only into expanded rows.
function expandedRows(byParent: AtlasBundle["byParent"], expandedIds: Set<string>): VisibleNode[] {
  const result: VisibleNode[] = [];
  function walk(parentId: string | null, parentDocNo?: string) {
    for (const node of byParent.get(parentId) ?? []) {
      const hasChildren = byParent.has(node.id);
      result.push({ node, hasChildren, treeDepth: realDepth(node.doc_no, parentDocNo), parentDocNo });
      if (hasChildren && expandedIds.has(node.id)) walk(node.id, node.doc_no);
    }
  }
  walk(null);
  return result;
}

/** The rows the sidebar shows, top to bottom, for the active view: the flat
 *  "changed only" list, the "selected only" tree, or the expanded full tree. */
export function visibleTreeRows(
  bundle: AtlasBundle | null,
  expandedIds: Set<string>,
  changedSet: Set<string> | null,
  selectionSet: Set<string> | null,
): VisibleNode[] {
  if (!bundle) return [];
  if (changedSet) return changedOnlyRows(bundle.docs, changedSet);
  // "Selected only": ONLY selected docs, arranged by selection nesting, with
  // working chevrons that reveal just the selected descendants. See
  // buildSelectedOnlyNodes.
  if (selectionSet) return buildSelectedOnlyNodes(bundle.byParent, selectionSet, expandedIds);
  return expandedRows(bundle.byParent, expandedIds);
}

// Cradle: a left rail in the selected node's depth colour hanging down the
// selected node's visible/expanded descendants, closed by a curved foot under
// the last one — the sidebar twin of the reader's cradle (AtlasReader). Because
// visibleNodes is DFS document order, those descendants are the contiguous run
// of deeper-treeDepth rows right after the selection; expanding more of them
// (manual toggle or expand-all reveal) grows the run, so the cradle extends
// automatically. No descendants visible → no cradle.
export function cradleRange(
  visibleNodes: VisibleNode[],
  selectedIndex: number,
  selectionSet: Set<string> | null,
  parentOf: ParentIndex,
): TreeRowData["cradle"] {
  const sel = selectedIndex >= 0 ? visibleNodes[selectedIndex] : undefined;
  if (!sel) return null;
  // Selected-only view: unselected intermediates are dropped, so a deeper
  // treeDepth does not imply "descendant of the selection" — a different
  // selected branch can sit deeper in the flattened list. Size the cradle by
  // TRUE descendants of the selected node instead (see selectedDescendantRunEnd).
  const end = selectionSet
    ? selectedDescendantRunEnd(visibleNodes, selectedIndex, parentOf) - 1
    : (descendantRun(visibleNodes, selectedIndex, (row) => row.treeDepth)?.end ?? selectedIndex);
  if (end <= selectedIndex) return null;
  return { start: selectedIndex + 1, end, color: depthColor(sel.treeDepth) };
}
