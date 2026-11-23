import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { ListImperativeAPI } from "react-window";
import { track } from "../lib/analytics";
import { scrollRequestStore } from "../lib/scrollRequestStore";
import type { SetExpandedIds } from "./useTreeExpansion";
import { useTreeKeyboard } from "./useTreeKeyboard";
import type { TreeRows } from "./useTreeView";

type ListRef = RefObject<ListImperativeAPI | null>;

// Brings the selected row into view when the selection changes. The returned
// callback marks the next selection change as coming from a click on a row,
// which is already in view and must not move.
function useScrollToSelected(listRef: ListRef, nodeId: string | null, selectedIndex: number) {
  const clickedRef = useRef(false);
  const scrolledForRef = useRef<string | null>(null);
  useEffect(() => {
    if (clickedRef.current) {
      clickedRef.current = false;
      scrolledForRef.current = nodeId;
      return;
    }
    // Only scroll when the *selected node* changes (a real navigation). Expanding
    // or collapsing another section shifts selectedIndex without changing nodeId —
    // that must not jerk the view back to the selection (it would fight the user
    // who is scrolling/expanding elsewhere).
    if (nodeId === scrolledForRef.current) return;
    if (selectedIndex >= 0 && listRef.current) {
      listRef.current.scrollToRow({ index: selectedIndex, align: "smart" });
      scrolledForRef.current = nodeId;
    }
  }, [selectedIndex, nodeId, listRef]);
  return useCallback(() => {
    clickedRef.current = true;
  }, []);
}

interface Params {
  rows: TreeRows;
  expandedIds: Set<string>;
  setExpandedIds: SetExpandedIds;
  listRef: ListRef;
  nodeId: string | null;
  onNavigate: (id: string) => void;
  onShiftNavigate?: (id: string) => void;
}

/** Where the reader is in the tree: the keyboard-focused row, the arrow-key
 *  handler that moves it, the scroll that follows the selection, and the row
 *  click that navigates. */
export function useTreeCursor({ rows, nodeId, onNavigate, listRef, ...keys }: Params) {
  const { visibleNodes, selectedIndex } = rows;
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // A mouse-driven toggle (plain collapse, cascade collapse, switching flat
  // views, …) can shrink visibleNodes out from under a keyboard-focused row,
  // leaving focusedIndex stale and past the end of the new, shorter array.
  // useTreeKeyboard guards its own indexing against that, but the stale index
  // is still wrong to keep around — clamp it back into range (or to -1, "no
  // focus", once the list is empty) whenever the visible list changes.
  useEffect(() => {
    setFocusedIndex((prev) => (prev >= visibleNodes.length ? visibleNodes.length - 1 : prev));
  }, [visibleNodes]);

  const skipNextScroll = useScrollToSelected(listRef, nodeId, selectedIndex);
  const handleKeyDown = useTreeKeyboard({
    ...keys, visibleNodes, selectedIndex, focusedIndex, setFocusedIndex, listRef, onNavigate,
  });

  const navigateTo = useCallback(
    (id: string) => {
      track("reader_sidebar_nav", { node_id: id });
      skipNextScroll();
      setFocusedIndex(-1);
      onNavigate(id);
      scrollRequestStore.request(id);
    },
    [onNavigate, skipNextScroll],
  );

  return { focusedIndex, handleKeyDown, navigateTo };
}
