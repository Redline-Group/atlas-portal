import { useCallback, useMemo } from "react";
import type { AtlasBundle } from "../lib/docs";
import { track } from "../lib/analytics";
import { toggled } from "../lib/setOps";
import type { TreeRowData } from "../components/tree/TreeRow";
import { useTreeCascade } from "./useTreeCascade";
import type { SetExpandedIds } from "./useTreeExpansion";

interface Params {
  bundle: AtlasBundle | null;
  expandedIds: Set<string>;
  setExpandedIds: SetExpandedIds;
  rollup: TreeRowData["rollup"];
  canCascade: boolean;
}

export function useChevronActions({ bundle, expandedIds, setExpandedIds, rollup, canCascade }: Params) {
  const { revealChanges, cascadeLevels, collapseSubtree } = useTreeCascade(bundle, setExpandedIds, rollup);

  const onToggle = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const wasExpanded = expandedIds.has(id);
      track("reader_sidebar_toggle", {
        node_id: id,
        action: wasExpanded ? "collapse" : "expand",
        cascade: e.shiftKey,
      });
      // Not in selected-only view: cascading the full tree would open rows that render nothing there.
      if (e.shiftKey && canCascade) return wasExpanded ? collapseSubtree(id) : cascadeLevels(id);
      setExpandedIds((prev) => toggled(prev, id));
    },
    [expandedIds, canCascade, cascadeLevels, collapseSubtree, setExpandedIds],
  );

  return useMemo(() => ({ onToggle, onReveal: revealChanges }), [onToggle, revealChanges]);
}
