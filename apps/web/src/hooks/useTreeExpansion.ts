import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { AtlasBundle } from "../lib/docs";
import { revealStore } from "../lib/revealStore";
import { withAncestors, type ParentIndex } from "../lib/treeExpansion";

const EXPANDED_IDS_KEY = "rl-tree-expanded";
const EXPANDED_IDS_MAX = 2000;

// sessionStorage (not localStorage): per-tab, survives a reload, dies with the
// tab — UUID keys are stable across builds so a stale entry is harmless.
function loadExpandedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(EXPANDED_IDS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveExpandedIds(expandedIds: Set<string>): void {
  if (expandedIds.size > EXPANDED_IDS_MAX) return;
  try {
    sessionStorage.setItem(EXPANDED_IDS_KEY, JSON.stringify([...expandedIds]));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

export type SetExpandedIds = Dispatch<SetStateAction<Set<string>>>;

/** The set of expanded row ids. It persists for the tab, and opens whatever
 *  hides the selected document or a row the reader asks to reveal. */
export function useTreeExpansion(
  bundle: AtlasBundle | null,
  parentOf: ParentIndex,
  nodeId: string | null,
): [Set<string>, SetExpandedIds] {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(loadExpandedIds);

  // Persist expansion state so reload paths that remain in the app (the footer's
  // update pill, forced stale reloads) don't wipe the tree back to fully collapsed.
  useEffect(() => saveExpandedIds(expandedIds), [expandedIds]);

  // Expand every ancestor so the selected node is visible, stepping upward
  // along the same relation the tree is grouped by. Deliberately NOT expanding
  // the selected node itself. Ancestors have to open or the row could not be
  // shown at all, but unfolding the node's own children turns "open this doc"
  // into "open this doc and rearrange the tree under it". Selecting picks a
  // doc; only the chevron changes shape.
  useEffect(() => {
    if (!bundle || !nodeId || !parentOf.has(nodeId)) return;
    setExpandedIds((prev) => withAncestors(prev, parentOf, [nodeId]));
  }, [bundle, nodeId, parentOf]);

  // Reader-side expansions (single or expand-all) ask us to make those rows
  // visible by expanding their ancestors, without changing the selection.
  useEffect(() => {
    if (!bundle) return;
    const { docs } = bundle;
    return revealStore.subscribe((ids) => {
      setExpandedIds((prev) => withAncestors(prev, parentOf, ids.filter((id) => docs[id])));
    });
  }, [bundle, parentOf]);

  return [expandedIds, setExpandedIds];
}
