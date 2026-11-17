import type { MouseEvent } from "react";

type Click = Pick<MouseEvent, "button" | "shiftKey" | "ctrlKey" | "metaKey" | "altKey">;

/** A left click with no modifier: the one click a link may take over for in-app
 *  navigation. Every other click is the browser's (new tab, new window, …). */
export const isPlainClick = (e: Click): boolean =>
  e.button === 0 && !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey);

/** A left click with Shift alone: the reader's "open in the comparison pane" gesture. */
export const isShiftClick = (e: Click): boolean =>
  e.button === 0 && e.shiftKey && !(e.ctrlKey || e.metaKey || e.altKey);
