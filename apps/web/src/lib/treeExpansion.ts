import { collectSubtree } from "@/lib/atlasHelpers";
import type { AtlasBundle } from "./docs";
import { addedAll, removedAll } from "./setOps";

/** child id → parent id in the rendered tree; a top-level row maps to null. */
export type ParentIndex = Map<string, string | null>;

// child id → parent id in the *rendered* tree. byParent is built in the worker
// via resolveParentId (doc_no-aware, incl. the NR-by-id step), so inverting it
// gives the exact upward relation the tree renders by. Raw node.parentId is NOT
// that relation — it comes from a depth stack capped at 6, so for any node
// deeper than 6 levels it collapses onto the depth-6 ancestor and the real
// intermediate parents are lost. Walking it would skip those, leaving the
// selected node hidden (no sidebar selection). Walk this index instead.
export function parentIndex(bundle: AtlasBundle | null): ParentIndex {
  const m: ParentIndex = new Map();
  if (bundle) {
    for (const [pid, children] of bundle.byParent) {
      for (const child of children) m.set(child.id, pid);
    }
  }
  return m;
}

/** The ancestors of `id` in the rendered tree, nearest first. Walks parent
 *  links rather than doc_no "."-prefixes: a doc_no string-prefix walk silently
 *  does nothing for docs whose number has no dots (e.g. "NR-5" — Needed Research
 *  uses flat global numbering per ATLAS_MARKDOWN_SYNTAX.md). */
export function* ancestorsOf(parentOf: ParentIndex, id: string): Generator<string> {
  for (let pid = parentOf.get(id) ?? null; pid; pid = parentOf.get(pid) ?? null) yield pid;
}

/** `expanded` with every ancestor of each id open, so those rows are visible.
 *  Returns the SAME Set when nothing opens, so a state update bails out. The
 *  ids themselves stay as they are: only what hides a row has to open. */
export function withAncestors(
  expanded: Set<string>,
  parentOf: ParentIndex,
  ids: Iterable<string>,
): Set<string> {
  let next = expanded;
  for (const id of ids) next = addedAll(next, ancestorsOf(parentOf, id));
  return next;
}

/** `expanded` with `id` and every descendant under it closed. */
export function withoutSubtree(
  expanded: Set<string>,
  byParent: AtlasBundle["byParent"] | undefined,
  id: string,
): Set<string> {
  return removedAll(expanded, byParent ? collectSubtree(byParent, id) : [id]);
}
