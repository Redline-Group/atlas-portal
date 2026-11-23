import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { ListImperativeAPI } from "react-window";
import { track } from "../lib/analytics";
import { scrollRequestStore } from "../lib/scrollRequestStore";
import type { SetExpandedIds } from "./useTreeExpansion";
import { useTreeKeyboard } from "./useTreeKeyboard";
import type { TreeRows } from "./useTreeView";

type ListRef = RefObject<ListImperativeAPI | null>;

// The returned callback marks the next selection as a row click, which is already in view and must not scroll.
function useScrollToSelected(listRef: ListRef, nodeId: string | null, selectedIndex: number) {
  const clickedRef = useRef(false);
  const scrolledForRef = useRef<string | null>(null);
  useEffect(() => {
    if (clickedRef.current) {
      clickedRef.current = false;
      scrolledForRef.current = nodeId;
      return;
    }
    // Expanding elsewhere shifts selectedIndex without changing nodeId; that must not scroll back.
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

export function useTreeCursor({ rows, nodeId, onNavigate, listRef, ...keys }: Params) {
  const { visibleNodes, selectedIndex } = rows;
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // A mouse toggle can shrink visibleNodes under the focused row; clamp the stale index.
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
