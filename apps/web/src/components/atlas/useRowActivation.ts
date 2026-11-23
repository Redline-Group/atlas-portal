import { useRef } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { track } from "../../lib/analytics";
import { revealStore } from "../../lib/revealStore";
import { useAtlasActions } from "./AtlasActionsContext";

const DRAG_THRESHOLD_PX = 4;
const CLICK_CONTROLS = 'a, button, [role="button"]';
const KEY_CONTROLS = `${CLICK_CONTROLS}, input, select, textarea, [contenteditable]`;

export interface ActivatedRow {
  nodeId: string;
  isSelected: boolean;
  isExpanded: boolean;
  hasContent: boolean;
}

type RowActions = Pick<ReturnType<typeof useAtlasActions>, "navigate" | "toggle" | "splitNavigate">;

const within = (target: EventTarget, selector: string) => !!(target as Element).closest(selector);

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
    track("reader_title_click", { node_id: row.nodeId });
    actions.navigate(row.nodeId);
    return;
  }
  if (row.hasContent && within(e.target, "[data-row-bar]")) toggleBody(row, actions);
}

function keyRow(e: KeyboardEvent, row: ActivatedRow, actions: RowActions) {
  if (e.key !== "Enter" && e.key !== " ") return;
  if (within(e.target, KEY_CONTROLS)) return;
  e.preventDefault();
  if (row.isSelected && row.hasContent) toggleBody(row, actions);
  else actions.navigate(row.nodeId);
}

export function useRowActivation(row: ActivatedRow) {
  const actions = useAtlasActions();
  const downAt = useRef<{ x: number; y: number } | null>(null);
  return {
    onMouseDown: (e: MouseEvent) => {
      downAt.current = { x: e.clientX, y: e.clientY };
    },
    onClick: (e: MouseEvent) => {
      if (within(e.target, CLICK_CONTROLS)) return;
      // Drag-text-select fires a click on mouseup; skip it.
      const down = downAt.current;
      downAt.current = null;
      const dragged = (to: number, from: number) => Math.abs(to - from) > DRAG_THRESHOLD_PX;
      if (down && (dragged(e.clientX, down.x) || dragged(e.clientY, down.y))) return;
      clickRow(e, row, actions);
    },
    onKeyDown: (e: KeyboardEvent) => keyRow(e, row, actions),
  };
}
