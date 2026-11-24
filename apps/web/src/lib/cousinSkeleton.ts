import type { AtlasNode } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import { primeRoots, titleKeyer } from "./cousinTitles";

type Atlas = Pick<AtlasBundle, "docs" | "docNoToId">;

// fragile: doc_no prefix — a doc in a Prime Agent artifact, A.6.1.1.<n>(.…)
const ARTIFACT_RE = /^A\.6\.1\.1\.(\d+)((?:\.\d+)*)$/;

/**
 * Cousins of an artifact skeleton doc: one no primitive or instance covers and
 * that is not an omni doc (the artifact root, its Introduction, Sky Primitives,
 * the primitive-category headings). Every artifact repeats that skeleton, so its
 * counterpart is the doc at the same place under each other prime, provided
 * the title matches too.
 */
export function findSkeletonCousins(target: AtlasNode, atlas: Atlas): { node: AtlasNode; prime: string }[] {
  const m = ARTIFACT_RE.exec(target.doc_no);
  if (!m) return [];
  const [, targetPrime, suffix] = m;
  const key = titleKeyer(atlas.docs);
  const title = key(target.title);
  const out: { node: AtlasNode; prime: string }[] = [];
  for (const [prime, root] of primeRoots(atlas.docs)) {
    if (prime === targetPrime) continue;
    const id = atlas.docNoToId.get(`${root.doc_no}${suffix}`);
    const node = id ? atlas.docs[id] : undefined;
    if (node && key(node.title) === title) out.push({ node, prime });
  }
  return out;
}
