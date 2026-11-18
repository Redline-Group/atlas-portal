import { useMemo } from "react";
import { usePreviewDiff } from "../lib/previewDiff";
import { withRemovedDocs } from "../lib/previewRemoved";
import type { AtlasBundle } from "../lib/docs";
import { flattenTree, type LoadedData } from "@/lib/atlasHelpers";

// The preview's removed documents, put back in place for the tree and the
// reader (previewRemoved.ts). Outside preview, or with nothing removed, each
// returns what it was given.

export function useBundleWithRemoved(bundle: AtlasBundle | null): AtlasBundle | null {
  const { removedDocs } = usePreviewDiff();
  return useMemo(() => (bundle ? withRemovedDocs(bundle, removedDocs) : null), [bundle, removedDocs]);
}

/** The reader's data with the removed documents in place. Until a preview's
 *  diff and its removed records have loaded, the data does not count as
 *  complete: a link to a removed document would otherwise read "not found"
 *  for the moment before it arrives. */
export function useDataWithRemoved(data: LoadedData | null): LoadedData | null {
  const { removedDocs, removed, pending } = usePreviewDiff();
  return useMemo(() => {
    if (!data) return data;
    const waiting = pending || (!!removed?.size && !removedDocs);
    if (waiting) return data.complete ? { ...data, complete: false } : data;
    if (!removedDocs?.length) return data;
    const atlas = withRemovedDocs(data.atlas, removedDocs);
    return { ...data, atlas, flatNodes: flattenTree(atlas.byParent) };
  }, [data, removedDocs, removed, pending]);
}
