// removed.json: every document the preview dropped, in full, with where it
// stood, so the reader can show it in place. The head never had it, so its
// position is stated against what the reader does have: its parent's UUID and
// the sibling it followed.
//
// Both are read off docTree (src/lib/atlasTree.ts), the tree the reader itself
// renders, never the parser's stored parentId: below the heading-depth cap the
// two disagree, and a removed document placed by parentId lands under a distant
// ancestor. The parent is the one the base's tree gives it. The anchor is the
// nearest earlier sibling in the base's tree that the reader will also show
// under that parent (another removed document, or one the head's tree keeps
// there), so inserting each entry after its anchor, in list order, rebuilds
// the base's order among the siblings that remain.

import { docTree, type DocTree } from "../../lib/atlasTree.ts";
import type { RemovedDoc } from "../../lib/previewPatch.ts";
import type { AtlasNode } from "../../types.ts";
import type { Snapshot } from "./snapshot.ts";

function asDocs(s: Snapshot): Record<string, AtlasNode> {
  const out: Record<string, AtlasNode> = {};
  for (const [id, n] of s) {
    out[id] = { ...n, title: n.title ?? "", type: n.type ?? "", content: n.content ?? "", depth: n.depth ?? 1, parentId: n.parentId ?? null, order: n.order ?? 0, addressRefs: [] };
  }
  return out;
}

/** The reader's tree of a snapshot. Not cached across calls: the live atlas's
 *  docMap, which can serve as a base snapshot, is updated in place. */
const treeOf = (s: Snapshot): DocTree => docTree(asDocs(s));

/** The nearest earlier base sibling the reader will also show under `parentId`. */
function anchor(id: string, siblings: AtlasNode[], parentId: string | null, removed: Set<string>, headParentOf: Map<string, string | null>): string | null {
  for (let i = siblings.findIndex((s) => s.id === id) - 1; i >= 0; i--) {
    const s = siblings[i].id;
    if (removed.has(s) || (headParentOf.has(s) && headParentOf.get(s) === parentId)) return s;
  }
  return null;
}

/** The nearest base ancestor the reader shows: kept by the head, or removed
 *  too. A parent can be neither when main already removed it (so it is not a
 *  change, diff-artifacts.ts) while the child is still on main. */
function shownParent(id: string, parentOf: Map<string, string | null>, removed: Set<string>, head: Snapshot): string | null {
  let p = parentOf.get(id) ?? null;
  while (p && !head.has(p) && !removed.has(p)) p = parentOf.get(p) ?? null;
  return p;
}

/** The removed documents in base tree order (parents before children), each with its placement. */
export function removedDocs(ids: string[], base: Snapshot, head: Snapshot): RemovedDoc[] {
  if (!ids.length) return [];
  const removed = new Set(ids);
  const baseTree = treeOf(base);
  const headParentOf = treeOf(head).parentOf;
  const docs = ids.map((id) => base.get(id)!).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return docs.map((d) => {
    const parentId = shownParent(d.id, baseTree.parentOf, removed, head);
    return {
      id: d.id,
      doc_no: d.doc_no,
      title: d.title,
      type: d.type,
      content: d.content ?? "",
      parentId,
      after: anchor(d.id, baseTree.byParent.get(parentId) ?? [], parentId, removed, headParentOf),
      depth: d.depth ?? 1,
    };
  });
}
