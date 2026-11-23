import { realDepth, segmentDepths } from "@/lib/depth";
import type { AtlasNode } from "@/types";
import type { AtlasBundle } from "./docs";
import type { ParentIndex } from "./treeExpansion";
import type { TreeRowData } from "../components/tree/TreeRow";

// NR-X doc_nos are not positional, so their depth comes from the parent's doc_no.
function chicletDepth(node: AtlasNode, docs: AtlasBundle["docs"], parentOf: ParentIndex): number {
  if (node.doc_no.startsWith("NR-")) {
    const pid = parentOf.get(node.id);
    return realDepth(node.doc_no, pid ? docs[pid]?.doc_no : undefined);
  }
  const segs = segmentDepths(node.doc_no);
  return segs[segs.length - 1] ?? 0;
}

// Walks parentOf (the relation the tree renders by) so counts match what a collapsed row hides.
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
