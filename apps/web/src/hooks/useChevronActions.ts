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
  /** Whether shift-click on a chevron acts on the whole subtree. */
  canCascade: boolean;
}

/** What a row's chevron and its rollup badge do when clicked. */
export function useChevronActions({ bundle, expandedIds, setExpandedIds, rollup, canCascade }: Params) {
  const { revealChanges, cascadeLevels, collapseSubtree } = useTreeCascade(bundle, setExpandedIds, rollup);

  const onToggle = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const wasExpanded = expandedIds.has(id);
      track("reader_sidebar_toggle", {
        node_id: id,
        action: wasExpanded ? "collapse" : "expand",
        // Shift is the bulk gesture in both directions: cascade open from
        // closed, collapse the whole subtree from open.
        cascade: e.shiftKey,
      });
      // Skipped in selected-only view — its rows are filtered to selected docs
      // only, so following the full tree would touch nodes that render nothing
      // there and surprise the user once they leave selected-only. Falls
      // through to a plain one-level toggle.
      if (e.shiftKey && canCascade) return wasExpanded ? collapseSubtree(id) : cascadeLevels(id);
      setExpandedIds((prev) => toggled(prev, id));
    },
    [expandedIds, canCascade, cascadeLevels, collapseSubtree, setExpandedIds],
  );

  return useMemo(() => ({ onToggle, onReveal: revealChanges }), [onToggle, revealChanges]);
}
