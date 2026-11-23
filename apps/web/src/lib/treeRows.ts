import { realDepth, depthColor } from "@/lib/depth";
import type { AtlasBundle } from "./docs";
import type { ParentIndex } from "./treeExpansion";
import { descendantRun } from "./visualTree";
import { buildSelectedOnlyNodes, selectedDescendantRunEnd } from "./selectedTree";
import type { TreeRowData, VisibleNode } from "../components/tree/TreeRow";

function changedOnlyRows(docs: AtlasBundle["docs"], changedSet: Set<string>): VisibleNode[] {
  return Object.values(docs)
    .filter((n) => changedSet.has(n.id))
    .sort((a, b) => a.order - b.order)
    // Real depth, not a flat 1, so chiclet colours match the reader.
    .map((node) => ({ node, hasChildren: false, treeDepth: node.depth }));
}

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

export function visibleTreeRows(
  bundle: AtlasBundle | null,
  expandedIds: Set<string>,
  changedSet: Set<string> | null,
  selectionSet: Set<string> | null,
): VisibleNode[] {
  if (!bundle) return [];
  if (changedSet) return changedOnlyRows(bundle.docs, changedSet);
  if (selectionSet) return buildSelectedOnlyNodes(bundle.byParent, selectionSet, expandedIds);
  return expandedRows(bundle.byParent, expandedIds);
}

// Rows are DFS order, so the selection's visible descendants are the contiguous deeper run after it.
export function cradleRange(
  visibleNodes: VisibleNode[],
  selectedIndex: number,
  selectionSet: Set<string> | null,
  parentOf: ParentIndex,
): TreeRowData["cradle"] {
  const sel = selectedIndex >= 0 ? visibleNodes[selectedIndex] : undefined;
  if (!sel) return null;
  // Selected-only drops intermediates, so a deeper row may be another branch; use true descendants.
  const end = selectionSet
    ? selectedDescendantRunEnd(visibleNodes, selectedIndex, parentOf) - 1
    : (descendantRun(visibleNodes, selectedIndex, (row) => row.treeDepth)?.end ?? selectedIndex);
  if (end <= selectedIndex) return null;
  return { start: selectedIndex + 1, end, color: depthColor(sel.treeDepth) };
}
