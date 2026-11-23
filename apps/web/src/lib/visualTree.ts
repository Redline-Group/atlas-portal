import type { FlatEntry } from "@/lib/atlasHelpers";

// The reader's VISUAL tree: what the user sees as nested. flatNodes is display
// order and `depth` is the doc-number realDepth used for indentation, so a
// row's on-screen subtree is the contiguous run of following rows indented
// deeper than it. It can differ from the parentId subtree when the
// heading-level-6 cap reparents a deeply-numbered doc — so hiding, counting,
// revealing and selection all key off this visual span instead of parentId,
// keeping what disappears matched to what looked nested.

/** A reader row's indentation depth. */
export const entryDepth = (entry: FlatEntry): number => entry.depth;

/** An inclusive span of row indexes. */
export interface RowSpan {
  start: number;
  end: number;
}

/** Index span of the contiguous deeper run right after `index`; null when the
 *  entry has no on-screen descendants (or `index` is not a row). `depthOf`
 *  reads a row's indentation, so any depth-ordered row list can use it. */
export function descendantRun<T>(
  entries: readonly T[],
  index: number,
  depthOf: (entry: T) => number,
): RowSpan | null {
  if (index < 0 || index >= entries.length) return null;
  const depth = depthOf(entries[index]);
  let j = index + 1;
  while (j < entries.length && depthOf(entries[j]) > depth) j++;
  return j > index + 1 ? { start: index + 1, end: j - 1 } : null;
}

export function visualSubtreeIds(flatNodes: FlatEntry[], rootId: string): string[] {
  const run = descendantRun(flatNodes, flatNodes.findIndex((e) => e.node.id === rootId), entryDepth);
  return run ? flatNodes.slice(run.start, run.end + 1).map((e) => e.node.id) : [];
}

/** The visual ancestor chain of `id`, nearest first; null when `id` has no row. */
export function visualAncestorIds(entries: FlatEntry[], id: string): string[] | null {
  const i = entries.findIndex((e) => e.node.id === id);
  if (i < 0) return null;
  const ancestors: string[] = [];
  let depth = entries[i].depth;
  for (let j = i - 1; j >= 0 && depth > 0; j--) {
    if (entries[j].depth < depth) {
      depth = entries[j].depth;
      ancestors.push(entries[j].node.id);
    }
  }
  return ancestors;
}

export interface VisualTree {
  /** Size of each node's on-screen subtree (the deeper-indented run that
   *  follows it), for the "N hidden" count so it matches exactly the rows a
   *  collapse removes. */
  spanCount: Map<string, number>;
  /** Each node's IMMEDIATE on-screen children — the pendulum only ever
   *  discloses one level, so this is what it and the "N hidden" tab both walk. */
  children: Map<string, string[]>;
  /** The inverse of `children`, for walks that go UP (ancestorsOfMatches). */
  parent: Map<string, string>;
}

function adopt(tree: VisualTree, parentId: string, childId: string): void {
  const siblings = tree.children.get(parentId);
  if (siblings) siblings.push(childId);
  else tree.children.set(parentId, [childId]);
  tree.parent.set(childId, parentId);
}

// One O(n) depth-stack pass computes all three maps: they pop the same set
// (entries with depth >= the current row), so they share the walk; after
// popping, the stack top is the current row's on-screen parent — recorded
// there because the stack top already IS the parent at that point.
export function buildVisualTree(entries: FlatEntry[]): VisualTree {
  const tree: VisualTree = { spanCount: new Map(), children: new Map(), parent: new Map() };
  const stack: { id: string; index: number; depth: number }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const { node, depth } = entries[i];
    while (stack.length && stack[stack.length - 1].depth >= depth) {
      const top = stack.pop()!;
      tree.spanCount.set(top.id, i - top.index - 1);
    }
    if (stack.length) adopt(tree, stack[stack.length - 1].id, node.id);
    stack.push({ id: node.id, index: i, depth });
  }
  for (const top of stack) tree.spanCount.set(top.id, entries.length - top.index - 1);
  return tree;
}

// Every row hidden by a collapsed ancestor. One O(n) pass over the on-screen
// order: a row is hidden iff any of its visual ancestors is collapsed. Nested
// collapsed branches stay collapsed branches, so per-level disclosure (open
// one branch, its children appear but their own chevrons stay up) falls out
// for free.
export function hiddenByCollapse(entries: FlatEntry[], isCollapsed: (id: string) => boolean): Set<string> {
  const hidden = new Set<string>();
  const stack: { depth: number; collapsed: boolean }[] = [];
  let collapsedOnStack = 0;
  for (const entry of entries) {
    while (stack.length && stack[stack.length - 1].depth >= entry.depth) {
      if (stack.pop()!.collapsed) collapsedOnStack--;
    }
    if (collapsedOnStack > 0) hidden.add(entry.node.id);
    const collapsed = isCollapsed(entry.node.id);
    stack.push({ depth: entry.depth, collapsed });
    if (collapsed) collapsedOnStack++;
  }
  return hidden;
}

// Every ancestor of a doc in `matches`. The walk goes up the visual parent,
// NOT node.parentId: raw parentId comes from a heading-depth stack capped at 6
// (atlas-parser.mjs), so for anything nested deeper it collapses onto the
// depth-5 ancestor and the real intermediate parents drop out of the chain
// entirely. Gating a row's chevron on that chain denies it to every such
// intermediate row even though the pendulum (which always reads the visual
// children) has children to act on. This is the same visual relation the
// unfiltered view's hasChildren uses, so the two views agree.
export function ancestorsOfMatches(
  entries: FlatEntry[],
  parent: ReadonlyMap<string, string>,
  matches: ReadonlySet<string> | null,
): Set<string> {
  const set = new Set<string>();
  if (!matches) return set;
  for (const entry of entries) {
    if (!matches.has(entry.node.id)) continue;
    let pid = parent.get(entry.node.id) ?? null;
    while (pid && !set.has(pid)) {
      set.add(pid);
      pid = parent.get(pid) ?? null;
    }
  }
  return set;
}
