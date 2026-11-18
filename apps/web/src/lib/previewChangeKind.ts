import type { PreviewDiff } from "./previewDiff";

/** Every document this preview adds, changes or removes: what "Changed only"
 *  shows, the rollup badges count and the reveal flash marks. */
export function changedIds(diff: PreviewDiff): Set<string> {
  return new Set([...diff.added, ...diff.changed, ...(diff.removed ?? [])]);
}

/** How this preview changed a document, or null when it did not. */
export function changeKind(diff: PreviewDiff, id: string): "added" | "changed" | "removed" | null {
  if (diff.added.has(id)) return "added";
  if (diff.changed.has(id)) return "changed";
  return diff.removed?.has(id) ? "removed" : null;
}
