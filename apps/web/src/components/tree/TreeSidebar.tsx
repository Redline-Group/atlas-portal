import { useMemo, useRef, type RefObject } from "react";
import { List, useListRef, type ListImperativeAPI } from "react-window";
import { useAtlasTree } from "../../hooks/useAtlasTree";
import { usePulseDom } from "../../hooks/usePulseDom";
import { useElementWidth } from "../../hooks/useElementWidth";
import { useTreeView } from "../../hooks/useTreeView";
import { useTreeChangeMarks } from "../../hooks/useTreeChangeMarks";
import { useTreeCursor } from "../../hooks/useTreeCursor";
import { useChevronActions } from "../../hooks/useChevronActions";
import { PreviewTreeToggle } from "../preview/PreviewTreeToggle";
import { SelectionTreeToggle } from "../selection/SelectionTreeToggle";
import { TreeRow, ROW_HEIGHT, type TreeRowData } from "./TreeRow";

// Width the rows lay out against before the sidebar is first measured, and how
// far the measured width has to move before they lay out again.
const INITIAL_WIDTH = 242;
const WIDTH_TOLERANCE = 10;

interface RowsProps {
  listRef: RefObject<ListImperativeAPI | null>;
  rowProps: TreeRowData;
}

function TreeRows({ listRef, rowProps }: RowsProps) {
  return (
    <List
      listRef={listRef}
      rowCount={rowProps.visibleNodes.length}
      rowHeight={ROW_HEIGHT}
      rowComponent={TreeRow}
      rowProps={rowProps}
      overscanCount={20}
      // scrollbar-gutter: stable permanently reserves the 8px scrollbar lane
      // so rows never render under it — the JS title budget (SCROLLBAR_W) then
      // adds a small extra gap on top. Prevents titles kissing the scrollbar.
      style={{ flex: 1, scrollbarGutter: "stable" }}
    />
  );
}

interface Props {
  nodeId: string | null;
  onNavigate: (id: string) => void;
  onShiftNavigate?: (id: string) => void;
}

export function TreeSidebar({ nodeId, onNavigate, onShiftNavigate }: Props) {
  const bundle = useAtlasTree();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useListRef(null);
  usePulseDom(nodeId, containerRef);
  const { parentOf, expandedIds, setExpandedIds, changedSet, canCascade, rows } = useTreeView(bundle, nodeId);
  const sidebarWidth = useElementWidth(containerRef, INITIAL_WIDTH, WIDTH_TOLERANCE);
  const marks = useTreeChangeMarks(bundle, parentOf, expandedIds, changedSet);
  const { focusedIndex, handleKeyDown, navigateTo } = useTreeCursor({
    rows, expandedIds, setExpandedIds, listRef, nodeId, onNavigate, onShiftNavigate,
  });
  const chevrons = useChevronActions({ bundle, expandedIds, setExpandedIds, rollup: marks.rollup, canCascade });

  // canCascade goes to the rows too: selected-only view skips the shift branch
  // in the chevron toggle, so shift-click there is a plain one-level toggle.
  // TreeRow can't know that — it has no selectionSet — and without it the row
  // advertises the cascade on a chevron that won't cascade.
  const rowProps: TreeRowData = useMemo(
    () => ({
      ...rows, ...marks, ...chevrons, expandedIds, focusedIndex, sidebarWidth, canCascade,
      onNavigate: navigateTo, onShiftNavigate,
    }),
    [rows, marks, chevrons, expandedIds, focusedIndex, sidebarWidth, canCascade, navigateTo, onShiftNavigate],
  );

  if (!bundle) return <div className="tree-sidebar" ref={containerRef} />;

  return (
    <div
      className="tree-sidebar"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="tree"
      aria-label="Atlas tree"
      // Arrow keys only do something while this container holds focus, so the
      // footer only advertises them then. useContextHints reads the attribute
      // off focusin/focusout — nothing to wire up here.
      data-focus-hint="tree"
    >
      <PreviewTreeToggle />
      <SelectionTreeToggle />
      <TreeRows listRef={listRef} rowProps={rowProps} />
    </div>
  );
}
