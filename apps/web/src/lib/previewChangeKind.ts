import type { PreviewDiff } from "./previewDiff";

/** How this preview changed a document, or null when it did not. */
export function changeKind(diff: PreviewDiff, id: string): "added" | "changed" | "removed" | null {
  if (diff.added.has(id)) return "added";
  if (diff.changed.has(id)) return "changed";
  return diff.removed?.has(id) ? "removed" : null;
}
