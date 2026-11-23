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
      // Reserve the scrollbar lane so rows never render under it.
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

  // TreeRow has no selectionSet, so it needs canCascade to avoid advertising a cascade that won't happen.
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
      // useContextHints reads this on focusin/focusout; arrow keys only work while focused.
      data-focus-hint="tree"
    >
      <PreviewTreeToggle />
      <SelectionTreeToggle />
      <TreeRows listRef={listRef} rowProps={rowProps} />
    </div>
  );
}
