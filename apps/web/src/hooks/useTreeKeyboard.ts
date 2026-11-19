import { useCallback } from "react";
import { added, removed } from "../lib/setOps";
import type { VisibleNode } from "../components/tree/TreeRow";

interface Params {
  visibleNodes: VisibleNode[];
  focusedIndex: number;
  selectedIndex: number;
  expandedIds: Set<string>;
  listRef: React.MutableRefObject<{
    scrollToRow: (opts: {
      index: number;
      align: "auto" | "smart" | "center" | "start" | "end";
    }) => void;
  } | null>;
  onNavigate: (id: string) => void;
  onShiftNavigate?: (id: string) => void;
  setFocusedIndex: (i: number) => void;
  setExpandedIds: (fn: (prev: Set<string>) => Set<string>) => void;
}

type KeyContext = Params & { idx: number };

// `idx` can be stale: a mouse-driven toggle can shrink visibleNodes out
// from under the current focusedIndex (TreeSidebar clamps it back
// in a follow-up effect, but that runs after this handler could already
// have fired for the stale value). Never trust it directly — every
// lookup goes through `visibleNodes[idx]` optional-chained, and
// every index handed to scrollToRow is clamped into range first.
function moveFocus(c: KeyContext, delta: number) {
  const next = Math.min(Math.max(c.idx + delta, 0), c.visibleNodes.length - 1);
  c.setFocusedIndex(next);
  c.listRef.current?.scrollToRow({ index: next, align: "smart" });
}

function expandRow(c: KeyContext) {
  const entry = c.visibleNodes[c.idx];
  if (entry && entry.hasChildren && !c.expandedIds.has(entry.node.id)) {
    c.setExpandedIds((prev) => added(prev, entry.node.id));
  }
}

function collapseRow(c: KeyContext) {
  const entry = c.visibleNodes[c.idx];
  if (entry && c.expandedIds.has(entry.node.id)) {
    c.setExpandedIds((prev) => removed(prev, entry.node.id));
  }
}

function openRow(c: KeyContext, shiftKey: boolean) {
  const entry = c.visibleNodes[c.idx];
  if (!entry) return;
  // Shift+Enter is the keyboard twin of shift-clicking a row: open it
  // in the comparison pane. The cursor deliberately stays put — the
  // point of the split pane is to keep arrowing through the tree
  // against it, which a reset to -1 would throw away. Plain Enter is a
  // destination, so it still hands the tree back.
  if (shiftKey && c.onShiftNavigate) {
    c.onShiftNavigate(entry.node.id);
    return;
  }
  c.onNavigate(entry.node.id);
  c.setFocusedIndex(-1);
}

function handleTreeKey(e: React.KeyboardEvent, p: Params) {
  if (p.visibleNodes.length === 0) return;
  const c = { ...p, idx: p.focusedIndex >= 0 ? p.focusedIndex : p.selectedIndex };
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      moveFocus(c, 1);
      break;
    case "ArrowUp":
      e.preventDefault();
      moveFocus(c, -1);
      break;
    case "ArrowRight":
      e.preventDefault();
      expandRow(c);
      break;
    case "ArrowLeft":
      e.preventDefault();
      collapseRow(c);
      break;
    case "Enter":
      e.preventDefault();
      openRow(c, e.shiftKey);
      break;
  }
}

export function useTreeKeyboard(params: Params) {
  const {
    visibleNodes,
    focusedIndex,
    selectedIndex,
    expandedIds,
    listRef,
    onNavigate,
    onShiftNavigate,
    setFocusedIndex,
    setExpandedIds,
  } = params;
  return useCallback(
    (e: React.KeyboardEvent) =>
      handleTreeKey(e, {
        visibleNodes,
        focusedIndex,
        selectedIndex,
        expandedIds,
        listRef,
        onNavigate,
        onShiftNavigate,
        setFocusedIndex,
        setExpandedIds,
      }),
    [
      visibleNodes,
      focusedIndex,
      selectedIndex,
      expandedIds,
      listRef,
      onNavigate,
      onShiftNavigate,
      setFocusedIndex,
      setExpandedIds,
    ],
  );
}
