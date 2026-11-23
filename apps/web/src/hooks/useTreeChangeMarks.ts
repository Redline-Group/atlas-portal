import { useMemo } from "react";
import type { AtlasBundle } from "../lib/docs";
import { changedIds } from "../lib/previewFilter";
import { usePreviewDiff } from "../lib/previewDiff";
import { useDataSource } from "../lib/dataSource";
import { changeRollup } from "../lib/changeRollup";
import type { ParentIndex } from "../lib/treeExpansion";
import type { TreeRowData } from "../components/tree/TreeRow";
import { useRevealFlash } from "./useRevealFlash";

export type TreeChangeMarks = Pick<TreeRowData, "rollup" | "flashing" | "isPreview">;

export function useTreeChangeMarks(
  bundle: AtlasBundle | null,
  parentOf: ParentIndex,
  expandedIds: Set<string>,
  changedSet: Set<string> | null,
): TreeChangeMarks {
  const diff = usePreviewDiff();
  const isPreview = !!useDataSource().preview;

  const rollup = useMemo(() => {
    if (!bundle || !isPreview || changedSet) return new Map();
    return changeRollup(bundle.docs, parentOf, changedIds(diff));
  }, [bundle, isPreview, parentOf, diff, changedSet]);

  const flashIds = useMemo(() => changedIds(diff), [diff]);
  const flashing = useRevealFlash(flashIds, parentOf, expandedIds, isPreview && !!bundle && !changedSet);

  return useMemo(() => ({ rollup, flashing, isPreview }), [rollup, flashing, isPreview]);
}
