import type { FlatEntry } from "@/lib/atlasHelpers";

// Visual nesting by indentation, not parentId: the heading-level-6 cap reparents deep docs.

export const entryDepth = (entry: FlatEntry): number => entry.depth;

export interface RowSpan {
  start: number;
  end: number;
}

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
  spanCount: Map<string, number>;
  children: Map<string, string[]>;
  parent: Map<string, string>;
}

function adopt(tree: VisualTree, parentId: string, childId: string): void {
  const siblings = tree.children.get(parentId);
  if (siblings) siblings.push(childId);
  else tree.children.set(parentId, [childId]);
  tree.parent.set(childId, parentId);
}

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

// Visual parent, not parentId, which collapses deep chains onto the depth-5 ancestor.
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
