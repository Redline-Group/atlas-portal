import { useState, useEffect, useCallback, useMemo, type ReactElement } from "react";
import { buildAncestors, type FlatEntry, type LoadedData } from "@/lib/atlasHelpers";
import { CollapsibleNode } from "./CollapsibleNode";
import { AtlasActionsContext } from "./AtlasActionsContext";
import { useSplitHeight } from "./useSplitHeight";
import { JuniorPaneHeader } from "./JuniorPaneHeader";
import { descendantIds } from "../../lib/instanceDescendants";

const ViewChildrenFill = ({ docNo, onExpand }: { docNo: string; onExpand: () => void }) => (
  <button
    type="button"
    onClick={onExpand}
    className="view-children-fill w-full text-center mono text-[10px] text-tan-3 bg-transparent cursor-pointer"
  >
    view all descendants of {docNo}
  </button>
);

const DEPTH_LIMIT = 6;

const TopNote = () => (
  <div
    className="mono text-[10px] py-1 text-tan-3"
    style={{ opacity: 0.55, borderBottom: "1px solid var(--border)" }}
  >
    SplitView only renders selected doc and its children — Shift-Click a doc or link to view it here.
    Shift-Click inside SplitView to highlight it in the main view.
  </div>
);

const NoMoreNote = ({ docNo }: { docNo: string }) => (
  <div
    className="mono text-[10px] py-1 text-tan-3"
    style={{ opacity: 0.55, borderTop: "1px solid var(--border)" }}
  >
    no more descendants of {docNo} to view
  </div>
);

export function JuniorPane({
  splitId,
  data,
  onShiftNavigate,
  onShowInMain,
  onClose,
}: {
  splitId: string;
  data: LoadedData;
  /** Re-roots the pane: a plain click on a row or breadcrumb in it. */
  onShiftNavigate: (id: string) => void;
  /** Shift-click on a row: selects that doc in the main reader. Doc links in
   *  the pane do the same through useShiftClickDocLinks. */
  onShowInMain: (id: string) => void;
  onClose: () => void;
}) {
  const [userToggles, setUserToggles] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setUserToggles(new Set());
    setShowMore(false);
  }, [splitId]);

  const handleToggle = useCallback((nodeId: string) => {
    setUserToggles((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // JuniorPane styles the current node differently from the rest of the chain, so it keeps using buildAncestors and renders the current segment separately. See buildAncestorsWithSelf in atlasHelpers if that ever changes.
  const ancestors = useMemo(
    () => buildAncestors(data.atlas.docs, data.atlas.docNoToId, splitId),
    [data, splitId],
  );

  const { slice, hasMore, autoExpanded } = useMemo(() => {
    const node = data.atlas.docs[splitId];
    if (!node) return { slice: [] as FlatEntry[], hasMore: false, autoExpanded: new Set<string>() };
    const entry = data.flatNodes.find((e) => e.node.id === splitId);
    if (!entry)
      return { slice: [] as FlatEntry[], hasMore: false, autoExpanded: new Set<string>() };
    const maxDepth = entry.depth + DEPTH_LIMIT;

    // Collect descendants via parent links (byParent), not doc_no prefix —
    // doc_nos are editorial and get renumbered, parent ids are stable identity.
    const descendants = new Set(descendantIds(splitId, data.atlas.byParent));

    const slice: FlatEntry[] = [entry];
    let hasMore = false;
    for (const e of data.flatNodes) {
      if (descendants.has(e.node.id)) {
        if (e.depth <= maxDepth || showMore) slice.push(e);
        else hasMore = true;
      }
    }
    const autoExpanded = new Set<string>([splitId]);
    return { slice, hasMore, autoExpanded };
  }, [data, splitId, showMore]);

  const node = data.atlas.docs[splitId];
  const docNo = node?.doc_no ?? "";
  const hasAbove = ancestors.length > 0;

  const { paneRef, scrollerRef, contentRef, height, startResize } = useSplitHeight();

  const ctxValue = useMemo(
    () => ({
      navigate: onShiftNavigate,
      toggle: handleToggle,
      splitNavigate: onShowInMain,
      docNoToId: data.atlas.docNoToId,
    }),
    [onShiftNavigate, onShowInMain, handleToggle, data.atlas.docNoToId],
  );

  const items = useMemo(() => {
    const result: ReactElement[] = [];
    if (hasAbove) result.push(<TopNote key="top" />);
    // slice[0] is always splitId's own entry (see above); everything after it
    // is that node's descendants. Bound the selected root's position:sticky to
    // a group spanning it + those descendants — mirrors AtlasReader's
    // .selection-group — so the sticky root's containing block is just this
    // node's own slice, not the whole pane. Without it, the pane has no
    // bounding wrapper at all and a long-bodied root can occlude every
    // descendant at any scroll position (R2).
    const rows: ReactElement[] = slice.map((entry) => (
      <CollapsibleNode
        key={entry.node.id}
        entry={entry}
        idPrefix="junior"
        isSelected={entry.node.id === splitId}
        isExpanded={autoExpanded.has(entry.node.id) !== userToggles.has(entry.node.id)}
        // Drives only the selected-body cap (data-has-children): the split
        // root is capped exactly when it has descendants in the pane for its
        // sticky pin to occlude. No pendulum here, so no chevron appears.
        hasChildren={entry.node.id === splitId && slice.length > 1}
      />
    ));
    if (rows.length) {
      result.push(
        <div key="__selection-group" className="selection-group">
          {rows}
        </div>,
      );
    }
    if (hasMore)
      result.push(
        <ViewChildrenFill
          key="bottom"
          docNo={docNo}
          onExpand={() => setShowMore(true)}
        />,
      );
    else result.push(<NoMoreNote key="bottom" docNo={docNo} />);
    return result;
  }, [
    slice,
    hasMore,
    hasAbove,
    splitId,
    docNo,
    autoExpanded,
    userToggles,
  ]);

  return (
    // junior-pane: index.css swaps the shift-click hint in here for "highlight
    // in main view", and useShiftClickDocLinks keys on the class.
    <div
      ref={paneRef}
      className="junior-pane flex flex-col"
      style={{
        // Falls back to the 45% default until the column has been measured.
        flex: height == null ? "0 0 45%" : `0 0 ${height}px`,
        minHeight: 0,
        overflow: "hidden",
        // Positioning context for the drag handle — the pane's own overflow
        // would otherwise clip a handle anchored to an ancestor.
        position: "relative",
      }}
    >
      {/* Drag the top edge to resize, like the sidebars' vertical handles.
          Inside the pane (not at top: -3) because overflow: hidden clips it.
          TODO: mouse-only — not focusable, no role/keyboard resizing. Follow-up
          PR: make this an accessible separator with arrow-key resize. */}
      <div
        onMouseDown={startResize}
        title="Drag to resize"
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 6, cursor: "row-resize", zIndex: 10 }}
      />
      <JuniorPaneHeader ancestors={ancestors} node={node} onShiftNavigate={onShiftNavigate} onClose={onClose} />
      <div ref={scrollerRef} className="junior-scroll overflow-y-auto flex-1">
        <div ref={contentRef} className="mx-auto px-3 py-2">
          <AtlasActionsContext.Provider value={ctxValue}>{items}</AtlasActionsContext.Provider>
        </div>
      </div>
    </div>
  );
}
