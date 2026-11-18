// Removed documents, put back in place for a preview's tree and reader only.
// The preview's bundle never had them, so removed.json (written by the build,
// src/server/preview/removed-docs.ts) says where each stood: its parent and
// the sibling it followed. They join `docs` and `byParent` so the tree, the
// reader and `?id=` links reach them, and nothing else: search, the graph and
// doc-number lookups (`docNoToId`) read their own artifacts, so a removed
// document never turns up there.

import type { AtlasBundle } from "./docs";
import type { AtlasNode } from "@/types";
import type { RemovedDoc } from "@/lib/previewPatch";

function toNode(d: RemovedDoc, order: number): AtlasNode {
  return {
    id: d.id,
    doc_no: d.doc_no,
    title: d.title ?? "",
    type: d.type ?? "",
    depth: d.depth,
    parentId: d.parentId,
    content: d.content ?? "",
    order,
    addressRefs: [],
  };
}

/** Insert one removed document after its anchor, or first among its siblings.
 *  False when its parent is not in the bundle (a deep document before docs-deep lands). */
function place(d: RemovedDoc, docs: AtlasBundle["docs"], byParent: AtlasBundle["byParent"]): boolean {
  if (d.parentId && !docs[d.parentId]) return false;
  const siblings = [...(byParent.get(d.parentId) ?? [])];
  const at = d.after ? siblings.findIndex((s) => s.id === d.after) + 1 : 0;
  const anchorOrder = at > 0 ? siblings[at - 1].order : d.parentId ? docs[d.parentId].order : -1;
  const node = toNode(d, anchorOrder);
  siblings.splice(at, 0, node);
  byParent.set(d.parentId, siblings);
  docs[d.id] = node;
  return true;
}

/** The bundle with the removed documents in place. The same bundle when there are none. */
export function withRemovedDocs(bundle: AtlasBundle, removed: readonly RemovedDoc[] | undefined): AtlasBundle {
  if (!removed?.length) return bundle;
  const docs = { ...bundle.docs };
  const byParent = new Map(bundle.byParent);
  for (const d of removed) if (!docs[d.id]) place(d, docs, byParent);
  return { ...bundle, docs, byParent };
}
