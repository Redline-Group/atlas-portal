import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { AtlasBundle } from "../lib/docs";
import { revealStore } from "../lib/revealStore";
import { withAncestors, type ParentIndex } from "../lib/treeExpansion";

const EXPANDED_IDS_KEY = "rl-tree-expanded";
const EXPANDED_IDS_MAX = 2000;

// sessionStorage: per-tab, survives a reload; UUID keys make stale entries harmless.
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

export function useTreeExpansion(
  bundle: AtlasBundle | null,
  parentOf: ParentIndex,
  nodeId: string | null,
): [Set<string>, SetExpandedIds] {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(loadExpandedIds);

  useEffect(() => saveExpandedIds(expandedIds), [expandedIds]);

  // Opens ancestors only, deliberately not the selected node: selecting must not rearrange the tree under it.
  useEffect(() => {
    if (!bundle || !nodeId || !parentOf.has(nodeId)) return;
    setExpandedIds((prev) => withAncestors(prev, parentOf, [nodeId]));
  }, [bundle, nodeId, parentOf]);

  useEffect(() => {
    if (!bundle) return;
    const { docs } = bundle;
    return revealStore.subscribe((ids) => {
      setExpandedIds((prev) => withAncestors(prev, parentOf, ids.filter((id) => docs[id])));
    });
  }, [bundle, parentOf]);

  return [expandedIds, setExpandedIds];
}
