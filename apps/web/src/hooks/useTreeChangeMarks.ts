import { useMemo } from "react";
import type { AtlasBundle } from "../lib/docs";
import { changedIds } from "../lib/previewFilter";
import { usePreviewDiff } from "../lib/previewDiff";
import { useDataSource } from "../lib/dataSource";
import { changeRollup } from "../lib/changeRollup";
import type { ParentIndex } from "../lib/treeExpansion";
import type { TreeRowData } from "../components/tree/TreeRow";
import { useRevealFlash } from "./useRevealFlash";

/** What a preview paints onto the tree: the per-row count of changes hidden
 *  under it, and the rows flashing because a change just came into view. */
export type TreeChangeMarks = Pick<TreeRowData, "rollup" | "flashing" | "isPreview">;

export function useTreeChangeMarks(
  bundle: AtlasBundle | null,
  parentOf: ParentIndex,
  expandedIds: Set<string>,
  changedSet: Set<string> | null,
): TreeChangeMarks {
  const diff = usePreviewDiff();
  // Only preview mode has a diff; gate the rollup/flash/marks so the live reader
  // pays nothing for them (no per-row badge mounts, no reveal-flash effect).
  const isPreview = !!useDataSource().preview;

  // Skipped entirely in the flat "changed only" view (no hierarchy to roll into).
  const rollup = useMemo(() => {
    if (!bundle || !isPreview || changedSet) return new Map();
    return changeRollup(bundle.docs, parentOf, changedIds(diff));
  }, [bundle, isPreview, parentOf, diff, changedSet]);

  // Flash each changed/new doc when it becomes visible because an ancestor was
  // expanded (manual toggle or the staggered reveal) — see useRevealFlash.
  const flashIds = useMemo(() => changedIds(diff), [diff]);
  const flashing = useRevealFlash(flashIds, parentOf, expandedIds, isPreview && !!bundle && !changedSet);

  return useMemo(() => ({ rollup, flashing, isPreview }), [rollup, flashing, isPreview]);
}
