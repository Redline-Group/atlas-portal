import { realDepth, segmentDepths } from "@/lib/depth";
import type { AtlasNode } from "@/types";
import type { AtlasBundle } from "./docs";
import type { ParentIndex } from "./treeExpansion";
import type { TreeRowData } from "../components/tree/TreeRow";

// Colour depth must match the chiclet the row shows. NR-X nodes carry no
// positional doc_no — segmentDepths short-circuits them to [1] — so derive
// their depth from the tree (realDepth needs the parent's doc_no).
function chicletDepth(node: AtlasNode, docs: AtlasBundle["docs"], parentOf: ParentIndex): number {
  if (node.doc_no.startsWith("NR-")) {
    const pid = parentOf.get(node.id);
    return realDepth(node.doc_no, pid ? docs[pid]?.doc_no : undefined);
  }
  const segs = segmentDepths(node.doc_no);
  return segs[segs.length - 1] ?? 0;
}

// id → { count, depth } for the added/changed docs in its subtree. Walk up
// parentOf from each changed doc, incrementing every ancestor's count and
// tracking the max segment depth seen (so the badge can be tinted by the
// deepest change's depth colour). parentOf is the same doc_no-aware relation
// the tree renders by (see parentIndex), so this lines up with what a collapsed
// row actually hides. A new doc that itself has children is also an ancestor of
// changes (its kids are new), so it gets the same badge/pill/reveal as a changed
// doc with children.
export function changeRollup(
  docs: AtlasBundle["docs"],
  parentOf: ParentIndex,
  changed: Iterable<string>,
): TreeRowData["rollup"] {
  const m: TreeRowData["rollup"] = new Map();
  for (const id of changed) {
    const node = docs[id];
    if (!node) continue;
    const depth = chicletDepth(node, docs, parentOf);
    let pid = parentOf.get(id) ?? null;
    while (pid) {
      const cur = m.get(pid);
      if (cur) {
        cur.count++;
        if (depth > cur.depth) cur.depth = depth;
      } else {
        m.set(pid, { count: 1, depth });
      }
      pid = parentOf.get(pid) ?? null;
    }
  }
  return m;
}
