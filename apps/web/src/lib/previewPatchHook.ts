// One preview document's redline, built in the browser: the old side from
// before.json / removed.json (previewOldSide.ts), the new side from the
// preview's own docs, which the reader already holds. The same builder serves
// the chat and MCP tools on the server (src/lib/previewPatch.ts), so both show
// the same lines.

import { useEffect, useState } from "react";
import { useDataSource } from "./dataSource";
import { loadAtlas } from "./docs";
import { usePreviewDiff } from "./previewDiff";
import { loadPreviewBefore } from "./previewOldSide";
import { removedIndex } from "./previewRemoved";
import { candidateKey } from "@/lib/previewForkPoint";
import type { DiffLine } from "@/lib/history";
import { previewPatch, type RemovedDoc } from "@/lib/previewPatch";
import type { PreviewBaseKey } from "./previewMetaCopy";
import { changeKind } from "./previewChangeKind";

/** What one document's redline reads from the diff. */
interface PatchFacts {
  kind: "added" | "changed" | "removed";
  previousId?: string;
  swapped: boolean;
  removed?: RemovedDoc;
}

/** Load the old side and the preview's docs, then build `nodeId`'s redline. */
async function loadPatch(base: string, key: PreviewBaseKey | null, nodeId: string, f: PatchFacts): Promise<DiffLine[]> {
  const [before, atlas] = await Promise.all([loadPreviewBefore(base, key), loadAtlas(base)]);
  return previewPatch(nodeId, f.kind, {
    formerUuid: f.previousId ? { [nodeId]: { previousId: f.previousId } } : {},
    identitySwap: f.swapped ? { [nodeId]: { movedTo: true } } : {},
    before,
    doc: (id) => atlas.docs[id],
    removed: (id) => (id === nodeId ? f.removed : undefined),
  });
}

/** The redline for `nodeId`, or null outside preview, while loading, and for an unchanged document. */
export function usePreviewPatch(nodeId: string): DiffLine[] | null {
  const { base, preview } = useDataSource();
  // The base the diff provider resolved, so the redline always matches the diff shown.
  const diff = usePreviewDiff();
  const key = candidateKey(diff.activeBase?.key);
  // Only what this document's redline reads, so a later diff update that does
  // not touch it (removed records landing, the identity verdict) does not rebuild it.
  const kind = changeKind(diff, nodeId);
  const previousId = diff.formerUuid[nodeId]?.previousId;
  const swapped = !!diff.identitySwap[nodeId]?.movedTo;
  const removed = kind === "removed" ? removedIndex(diff.removedDocs).get(nodeId) : undefined;
  // Keyed by the document they belong to, so another document's lines are never shown while this one's load.
  const [state, setState] = useState<{ id: string; lines: DiffLine[] | null } | null>(null);
  useEffect(() => {
    if (!preview || !kind) return setState(null);
    let live = true;
    loadPatch(base, key, nodeId, { kind, previousId, swapped, removed })
      .then((lines) => live && setState({ id: nodeId, lines }))
      .catch(() => live && setState(null));
    return () => {
      live = false;
    };
  }, [base, preview, nodeId, key, kind, previousId, swapped, removed]);
  return state?.id === nodeId ? state.lines : null;
}
