// Removed documents, put back in place for a preview's tree and reader only.
// The preview's bundle never had them, so removed.json (written by the build,
// src/server/preview/removed-docs.ts) says where each stood: its parent and
// the sibling it followed. They join `docs` and `byParent` so the tree, the
// reader and `?id=` links reach them, and nothing else: search, the graph and
// doc-number lookups (`docNoToId`) read their own artifacts, so a removed
// document never turns up there. Each is marked (AtlasNode.removed), so shared
// lookups follow where it was placed rather than its old doc number.

import type { AtlasBundle } from "./docs";
import type { AtlasNode } from "@/types";
import type { RemovedDoc } from "@/lib/previewPatch";
import { cmpDocNo } from "@/lib/docNo";
import { removedDocNode } from "@/lib/previewRemovedNode";

/** Where a removed document goes among its siblings: right after its anchor;
 *  first when it had no earlier sibling; and, should the anchor be missing
 *  (a shallow bundle without it), by doc number, so it still sits beside its
 *  neighbours rather than jumping to the top. */
function indexFor(d: RemovedDoc, siblings: AtlasNode[]): number {
  if (!d.after) return 0;
  const at = siblings.findIndex((s) => s.id === d.after);
  if (at >= 0) return at + 1;
  const next = siblings.findIndex((s) => cmpDocNo(s.doc_no, d.doc_no) > 0);
  return next < 0 ? siblings.length : next;
}

/** Insert one removed document. False when its parent is not in the bundle yet.
 *  A parent's sibling list is copied once (`copied`), then spliced in place. */
function place(d: RemovedDoc, docs: AtlasBundle["docs"], byParent: AtlasBundle["byParent"], copied: Set<string | null>): boolean {
  if (d.parentId && !docs[d.parentId]) return false;
  if (!copied.has(d.parentId)) byParent.set(d.parentId, [...(byParent.get(d.parentId) ?? [])]);
  copied.add(d.parentId);
  const siblings = byParent.get(d.parentId)!;
  const at = indexFor(d, siblings);
  const order = at > 0 ? siblings[at - 1].order : d.parentId ? docs[d.parentId].order : -1;
  const node = removedDocNode(d, order);
  siblings.splice(at, 0, node);
  docs[d.id] = node;
  return true;
}

/** The bundle with the removed documents in place. The same bundle when there
 *  are none. A document whose parent is missing waits for a later pass (its
 *  parent may be another removed document further down the list), and is left
 *  out if the parent never arrives (a deep document before docs-deep lands). */
export function withRemovedDocs(bundle: AtlasBundle, removed: readonly RemovedDoc[] | undefined): AtlasBundle {
  if (!removed?.length) return bundle;
  // The tree and the reader both ask for the same bundle and list: build it once.
  const hit = merged.get(bundle);
  if (hit?.removed === removed) return hit.out;
  const docs = { ...bundle.docs };
  const byParent = new Map(bundle.byParent);
  const copied = new Set<string | null>();
  let waiting = removed.filter((d) => !docs[d.id]);
  for (let placed = true; waiting.length && placed; ) {
    const before = waiting.length;
    waiting = waiting.filter((d) => !place(d, docs, byParent, copied));
    placed = waiting.length < before;
  }
  const out = { ...bundle, docs, byParent };
  merged.set(bundle, { removed, out });
  return out;
}

const merged = new WeakMap<AtlasBundle, { removed: readonly RemovedDoc[]; out: AtlasBundle }>();
const indexes = new WeakMap<readonly RemovedDoc[], Map<string, RemovedDoc>>();

/** removed.json by id, built once per list. */
export function removedIndex(removed: readonly RemovedDoc[] | undefined): Map<string, RemovedDoc> {
  if (!removed) return new Map();
  let index = indexes.get(removed);
  if (!index) indexes.set(removed, (index = new Map(removed.map((d) => [d.id, d]))));
  return index;
}
