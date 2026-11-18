import { useMemo } from "react";
import { useDataSource } from "./dataSource";
import { usePreviewDiff } from "./previewDiff";
import { usePreviewView } from "./previewView";
import { filterPreviewDocs } from "./previewFilters";
import { changeKind } from "./previewChangeKind";

export { changedIds } from "./previewChangeKind";

/** A removed document is drawn this faint, whole: number, title, body and metadata. */
export const REMOVED_OPACITY = 0.55;

// The opacity a reader node or tree row takes in preview: faint for a removed
// document (selected or not), `untouched` for a document the branch left alone
// unless it is the selected one, full strength otherwise. Undefined outside preview.
export function usePreviewFade(nodeId: string, untouched: number, selected = false): number | undefined {
  const { preview } = useDataSource();
  const kind = changeKind(usePreviewDiff(), nodeId);
  if (!preview) return undefined;
  if (kind === "removed") return REMOVED_OPACITY;
  return kind || selected ? undefined : untouched;
}

// The set of doc ids to show when "show only changed" is on: exactly the docs
// this preview adds/changes that pass the ticked change filters
// (previewFilters.ts) — no ancestors. The sidebar and reader render these
// as a flat list (each keeps its full doc-number for context). Returns null when
// filtering is off (preview off or toggle off) — meaning "show everything" — and
// while the diff is still pending: its empty sets mean "not known yet", and the
// reader, the tree and the link gate must all treat that the same way.
export function usePreviewChangedSet(): Set<string> | null {
  const { preview } = useDataSource();
  const { onlyChanged, changeFilters } = usePreviewView();
  const diff = usePreviewDiff();
  return useMemo(() => {
    if (!preview || !onlyChanged || diff.pending) return null;
    return filterPreviewDocs(diff, changeFilters);
  }, [preview, onlyChanged, changeFilters, diff]);
}
