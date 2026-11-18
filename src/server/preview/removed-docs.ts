// removed.json: every document the preview dropped, in full, with where it
// stood, so the reader can show it in place. The head never had it, so its
// position is stated against what the reader does have: its parent's UUID and
// the sibling it followed. That sibling is one the reader will place under the
// same parent (another removed document, or one the head kept there), never a
// sibling that moved elsewhere, so inserting each entry after its `after` in
// list order rebuilds the base's order.

import type { RemovedDoc } from "../../lib/previewPatch.ts";
import type { Snapshot, SnapshotDoc } from "./snapshot.ts";

const byOrder = (a: SnapshotDoc, b: SnapshotDoc) => (a.order ?? 0) - (b.order ?? 0);

/** Base siblings of each parent that holds a removed document, in base order. */
function siblingsOf(ids: string[], base: Snapshot): Map<string | null, SnapshotDoc[]> {
  const parents = new Set(ids.map((id) => base.get(id)?.parentId ?? null));
  const out = new Map<string | null, SnapshotDoc[]>();
  for (const node of base.values()) {
    const p = node.parentId ?? null;
    if (!parents.has(p)) continue;
    const list = out.get(p) ?? [];
    list.push(node);
    out.set(p, list);
  }
  for (const list of out.values()) list.sort(byOrder);
  return out;
}

/** The nearest earlier sibling the reader will also place under `parentId`. */
function anchor(doc: SnapshotDoc, siblings: SnapshotDoc[], removed: Set<string>, head: Snapshot): string | null {
  const parentId = doc.parentId ?? null;
  for (let i = siblings.findIndex((s) => s.id === doc.id) - 1; i >= 0; i--) {
    const s = siblings[i];
    if (removed.has(s.id) || (head.get(s.id)?.parentId ?? null) === parentId) return s.id;
  }
  return null;
}

/** The removed documents in base order, each with its placement. */
export function removedDocs(ids: string[], base: Snapshot, head: Snapshot): RemovedDoc[] {
  const removed = new Set(ids);
  const siblings = siblingsOf(ids, base);
  const docs = ids.map((id) => base.get(id)!).sort(byOrder);
  return docs.map((d) => ({
    id: d.id,
    doc_no: d.doc_no,
    title: d.title,
    type: d.type,
    content: d.content ?? "",
    parentId: d.parentId ?? null,
    after: anchor(d, siblings.get(d.parentId ?? null) ?? [], removed, head),
    depth: d.depth ?? 1,
  }));
}
