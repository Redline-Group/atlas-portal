// Helpers for testing doc links inside the reader: the actions context a reader
// pane provides (AtlasActionsContext), and a way to see whether a click was
// taken by the app or left to the browser.

import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";

/** An AtlasActionsContext value with every action a spy. */
export function makeAtlasActions(docNoToId: [string, string][] = []) {
  return { navigate: vi.fn(), toggle: vi.fn(), splitNavigate: vi.fn(), docNoToId: new Map(docNoToId) };
}

/** Clicks `el` and reports whether anything before the document cancelled the
 *  click (the app took it) or not (the browser's). Cancels it afterwards, so
 *  jsdom does not try to follow a link. */
export function cancelledBefore(el: HTMLElement, init: MouseEventInit = {}): boolean {
  let cancelled = false;
  const watch = (e: MouseEvent) => {
    cancelled = e.defaultPrevented;
    e.preventDefault();
  };
  document.addEventListener("click", watch);
  fireEvent.click(el, init);
  document.removeEventListener("click", watch);
  return cancelled;
}
