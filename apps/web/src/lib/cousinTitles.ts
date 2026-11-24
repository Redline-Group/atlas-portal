import type { AtlasNode } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import { normTitle } from "@/lib/cousinFiling";
import { pushTo } from "@/lib/collections";

type Atlas = Pick<AtlasBundle, "docs" | "docNoToId">;

// Normalized title → docs, memoized on the docs object so it is built once per
// atlas load; the annotations memo re-runs cousin lookup on every navigation.
const titleIndexCache = new WeakMap<Record<string, AtlasNode>, Map<string, AtlasNode[]>>();
export function titleIndex(docs: Record<string, AtlasNode>): Map<string, AtlasNode[]> {
  let idx = titleIndexCache.get(docs);
  if (idx) return idx;
  idx = new Map();
  for (const d of Object.values(docs)) {
    const t = normTitle(d.title);
    if (t) pushTo(idx, t, d);
  }
  titleIndexCache.set(docs, idx);
  return idx;
}

export const parentDocNo = (docNo: string): string => docNo.slice(0, docNo.lastIndexOf("."));

export function titleAt(atlas: Atlas, docNo: string): string | undefined {
  const id = atlas.docNoToId.get(docNo);
  return id ? atlas.docs[id]?.title : undefined;
}

// The doc under `root` that plays the target's part. ICDs of one primitive are
// not laid out identically, so the target's doc_no suffix is only a first guess:
// the match is by title, with the parent's title breaking a tie, and no doc is
// better than a doc with a different title.
export function equivalentDoc(atlas: Atlas, target: AtlasNode, relSuffix: string, root: AtlasNode): AtlasNode | undefined {
  if (!relSuffix) return root;
  const title = normTitle(target.title);
  const alignedId = atlas.docNoToId.get(`${root.doc_no}${relSuffix}`);
  const aligned = alignedId ? atlas.docs[alignedId] : undefined;
  if (aligned && normTitle(aligned.title) === title) return aligned;
  const same = (titleIndex(atlas.docs).get(title) ?? []).filter((d) => d.doc_no.startsWith(`${root.doc_no}.`));
  if (same.length <= 1) return same[0];
  const parentTitle = normTitle(titleAt(atlas, parentDocNo(target.doc_no)));
  const byParent = same.filter((d) => normTitle(titleAt(atlas, parentDocNo(d.doc_no))) === parentTitle);
  return byParent.length === 1 ? byParent[0] : undefined;
}
