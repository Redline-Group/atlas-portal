// One preview document's redline, built in the browser: the old side from
// before.json / removed.json (previewOldSide.ts), the new side from the
// preview's own docs, which the reader already holds. The same builder serves
// the chat and MCP tools on the server (src/lib/previewPatch.ts), so both show
// the same lines.

import { useEffect, useState } from "react";
import { useDataSource } from "./dataSource";
import { loadAtlas } from "./docs";
import { usePreviewDiff, type PreviewDiff } from "./previewDiff";
import { loadPreviewBefore } from "./previewOldSide";
import type { PreviewBaseKey } from "./previewMetaCopy";
import type { DiffLine } from "@/lib/history";
import { previewPatch, type BeforeEntry } from "@/lib/previewPatch";
import { changeKind } from "./previewChangeKind";
import type { AtlasNode } from "@/types";

function patchOf(id: string, diff: PreviewDiff, before: Record<string, BeforeEntry>, docs: Record<string, AtlasNode>): DiffLine[] | null {
  const kind = changeKind(diff, id);
  if (!kind) return null;
  const previousId = diff.formerUuid[id]?.previousId;
  return previewPatch({
    id,
    kind,
    doc: kind === "removed" ? undefined : docs[id],
    before,
    removed: diff.removedDocs?.find((d) => d.id === id),
    previousId,
    previousDoc: previousId ? docs[previousId] : undefined,
    corroboratedSwap: !!diff.identitySwap[id]?.movedTo,
  });
}

/** The redline for `nodeId`, or null outside preview, while loading, and for an unchanged document. */
export function usePreviewPatch(nodeId: string): DiffLine[] | null {
  const { base, preview } = useDataSource();
  // The base the diff provider resolved, so the redline always matches the diff shown.
  const diff = usePreviewDiff();
  const key: PreviewBaseKey | null =
    diff.activeBase?.key === "sky" || diff.activeBase?.key === "repo" ? diff.activeBase.key : null;
  // Keyed by the document they belong to, so another document's lines are
  // never shown while this one's load.
  const [state, setState] = useState<{ id: string; lines: DiffLine[] | null } | null>(null);
  useEffect(() => {
    if (!preview || !changeKind(diff, nodeId)) return setState(null);
    let live = true;
    Promise.all([loadPreviewBefore(base, key), loadAtlas(base)])
      .then(([before, atlas]) => live && setState({ id: nodeId, lines: patchOf(nodeId, diff, before, atlas.docs) }))
      .catch(() => live && setState(null));
    return () => {
      live = false;
    };
  }, [base, preview, nodeId, key, diff]);
  return state?.id === nodeId ? state.lines : null;
}
