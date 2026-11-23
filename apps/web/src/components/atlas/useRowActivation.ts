import { useRef } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { track } from "../../lib/analytics";
import { revealStore } from "../../lib/revealStore";
import { useAtlasActions } from "./AtlasActionsContext";

const DRAG_THRESHOLD_PX = 4;
// A nested control (pendulum chevron, selection checkbox, copy buttons,
// in-content links, "Open on Sky Atlas") runs its OWN behaviour rather than
// having it swallowed into toggling/navigating the row.
const CLICK_CONTROLS = 'a, button, [role="button"]';
// Widened for the keyboard to also cover form controls that natively respond
// to Enter/Space.
const KEY_CONTROLS = `${CLICK_CONTROLS}, input, select, textarea, [contenteditable]`;

/** The row a gesture lands on. */
export interface ActivatedRow {
  nodeId: string;
  isSelected: boolean;
  isExpanded: boolean;
  hasContent: boolean;
}

type RowActions = Pick<ReturnType<typeof useAtlasActions>, "navigate" | "toggle" | "splitNavigate">;

const within = (target: EventTarget, selector: string) => !!(target as Element).closest(selector);

// Expanding (not collapsing) also asks the tree sidebar to reveal the node.
function toggleBody(row: ActivatedRow, actions: RowActions) {
  track("reader_node_toggle", { node_id: row.nodeId, action: row.isExpanded ? "collapse" : "expand" });
  if (!row.isExpanded) revealStore.reveal([row.nodeId]);
  actions.toggle(row.nodeId);
}

function clickRow(e: MouseEvent, row: ActivatedRow, actions: RowActions) {
  if (e.shiftKey) {
    e.preventDefault();
    actions.splitNavigate(row.nodeId);
    return;
  }
  if (!row.isSelected) {
    // Click anywhere on the row (title or body) selects it.
    track("reader_title_click", { node_id: row.nodeId });
    actions.navigate(row.nodeId);
    return;
  }
  // Already selected: only clicks on the title row (the [data-row-bar]
  // element — chiclets/title, not the expanded body) toggle the body. Body
  // clicks do nothing.
  if (row.hasContent && within(e.target, "[data-row-bar]")) toggleBody(row, actions);
}

function keyRow(e: KeyboardEvent, row: ActivatedRow, actions: RowActions) {
  if (e.key !== "Enter" && e.key !== " ") return;
  if (within(e.target, KEY_CONTROLS)) return;
  e.preventDefault();
  if (row.isSelected && row.hasContent) toggleBody(row, actions);
  else actions.navigate(row.nodeId);
}

/**
 * Mouse and keyboard activation for a reader row's <article>: select it, open
 * it in the split pane (shift), or toggle its body once selected.
 */
export function useRowActivation(row: ActivatedRow) {
  const actions = useAtlasActions();
  const downAt = useRef<{ x: number; y: number } | null>(null);
  return {
    onMouseDown: (e: MouseEvent) => {
      downAt.current = { x: e.clientX, y: e.clientY };
    },
    onClick: (e: MouseEvent) => {
      if (within(e.target, CLICK_CONTROLS)) return;
      // Drag-text-select fires a click on mouseup — skip those so selecting
      // a paragraph doesn't also toggle or navigate the row.
      const down = downAt.current;
      downAt.current = null;
      const dragged = (to: number, from: number) => Math.abs(to - from) > DRAG_THRESHOLD_PX;
      if (down && (dragged(e.clientX, down.x) || dragged(e.clientY, down.y))) return;
      clickRow(e, row, actions);
    },
    onKeyDown: (e: KeyboardEvent) => keyRow(e, row, actions),
  };
}
