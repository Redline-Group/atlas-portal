import { collectSubtree } from "@/lib/atlasHelpers";
import type { AtlasBundle } from "./docs";
import { addedAll, removedAll } from "./setOps";

/** child id → parent id in the rendered tree; a top-level row maps to null. */
export type ParentIndex = Map<string, string | null>;

// Not node.parentId: that comes from a depth stack capped at 6 and skips deeper intermediate parents.
export function parentIndex(bundle: AtlasBundle | null): ParentIndex {
  const m: ParentIndex = new Map();
  if (bundle) {
    for (const [pid, children] of bundle.byParent) {
      for (const child of children) m.set(child.id, pid);
    }
  }
  return m;
}

/** Nearest first. Walks parent links, not doc_no prefixes, which fail for dotless numbers like "NR-5". */
export function* ancestorsOf(parentOf: ParentIndex, id: string): Generator<string> {
  for (let pid = parentOf.get(id) ?? null; pid; pid = parentOf.get(pid) ?? null) yield pid;
}

/** Returns the SAME Set when nothing opens, so a state update bails out. */
export function withAncestors(
  expanded: Set<string>,
  parentOf: ParentIndex,
  ids: Iterable<string>,
): Set<string> {
  let next = expanded;
  for (const id of ids) next = addedAll(next, ancestorsOf(parentOf, id));
  return next;
}

export function withoutSubtree(
  expanded: Set<string>,
  byParent: AtlasBundle["byParent"] | undefined,
  id: string,
): Set<string> {
  return removedAll(expanded, byParent ? collectSubtree(byParent, id) : [id]);
}
