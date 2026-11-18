import type { ComponentProps } from "react";
import { usePreviewDiff } from "../../lib/previewDiff";

// "· N changes already on main": what the build left out because live main
// already has it (src/server/preview/diff-artifacts.ts). Without it, a branch
// whose edits main has since taken would look like it changes less than it does.

export function PreviewAlreadyOnMain(props: ComponentProps<"span">) {
  const { alreadyOnMain } = usePreviewDiff();
  const n = alreadyOnMain?.size ?? 0;
  if (!n) return null;
  return (
    <span
      className="text-xs text-tan-3"
      title="This branch also changes these documents, but main already has the same change, so they are not marked or counted as changes here."
      {...props}
    >
      {`· ${n} change${n === 1 ? "" : "s"} already on main, not shown`}
    </span>
  );
}
