import { useMemo } from "react";
import type { AtlasBundle } from "../lib/docs";
import { usePreviewChangedSet } from "../lib/previewFilter";
import { useSelectionSet } from "../lib/selectionFilter";
import { parentIndex } from "../lib/treeExpansion";
import { visibleTreeRows, cradleRange } from "../lib/treeRows";
import type { TreeRowData } from "../components/tree/TreeRow";
import { useTreeExpansion } from "./useTreeExpansion";

export type TreeRows = Pick<TreeRowData, "visibleNodes" | "selectedIndex" | "cradle">;

export function useTreeView(bundle: AtlasBundle | null, nodeId: string | null) {
  const parentOf = useMemo(() => parentIndex(bundle), [bundle]);
  const [expandedIds, setExpandedIds] = useTreeExpansion(bundle, parentOf, nodeId);
  const changedSet = usePreviewChangedSet();
  const selectionSet = useSelectionSet();

  const visibleNodes = useMemo(
    () => visibleTreeRows(bundle, expandedIds, changedSet, selectionSet),
    [bundle, expandedIds, changedSet, selectionSet],
  );
  const selectedIndex = useMemo(
    () => (nodeId ? visibleNodes.findIndex((v) => v.node.id === nodeId) : -1),
    [visibleNodes, nodeId],
  );
  const cradle = useMemo(
    () => cradleRange(visibleNodes, selectedIndex, selectionSet, parentOf),
    [visibleNodes, selectedIndex, selectionSet, parentOf],
  );
  const rows: TreeRows = useMemo(
    () => ({ visibleNodes, selectedIndex, cradle }),
    [visibleNodes, selectedIndex, cradle],
  );

  return { parentOf, expandedIds, setExpandedIds, changedSet, canCascade: !selectionSet, rows };
}
