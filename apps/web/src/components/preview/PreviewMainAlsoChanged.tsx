import { usePreviewDiff } from "../../lib/previewDiff";

// "≠": main has also changed this document since the branch was cut
// (mainAlsoChanged, src/server/preview/diff-artifacts.ts). The redline shows
// only the branch's own edits against where it left main, so without this a
// reader would take the old side for what main says today.

export const MAIN_ALSO_CHANGED =
  "Main has also changed this document since the branch was cut. The diff shows only this pull request's own edits, against main as the branch left it, so main's current version may differ from the old side shown.";

export function PreviewMainAlsoChangedMark({ nodeId, className }: { nodeId: string; className?: string }) {
  const { mainAlsoChanged } = usePreviewDiff();
  if (!mainAlsoChanged?.has(nodeId)) return null;
  return (
    <span
      className={className}
      title={MAIN_ALSO_CHANGED}
      aria-label="also changed on main since the branch was cut"
      style={{ color: "var(--tan-3)", fontWeight: 700, flexShrink: 0, cursor: "help" }}
    >
      ≠
    </span>
  );
}
