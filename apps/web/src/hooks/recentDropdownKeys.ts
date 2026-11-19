import { useCallback } from "react";
import type { KeyboardEvent } from "react";

interface KeyContext {
  visible: boolean;
  query: string;
  last: number;
  active: number;
  close: () => void;
  openDropdown: () => void;
  select: (i: number) => void;
  setActive: (next: number | ((a: number) => number)) => void;
}

// Keyboard rules of the dropdown: Escape closes, Up/Down move the highlight,
// Tab steps into the list, Enter runs the highlighted suggestion.
export function handleDropdownKey(e: KeyboardEvent, c: KeyContext) {
  if (e.key === "Escape") {
    c.close();
    return;
  }
  if (!c.visible) {
    // Re-summon by pressing Backspace/Delete on an already-empty field.
    if ((e.key === "Backspace" || e.key === "Delete") && c.query.trim() === "") c.openDropdown();
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    c.setActive((a) => Math.min(a + 1, c.last));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    c.setActive((a) => Math.max(a - 1, -1));
  } else if (e.key === "Tab" && !e.shiftKey && c.active === -1) {
    // Step into the dropdown so Enter runs the first suggestion.
    e.preventDefault();
    c.setActive(0);
  } else if (e.key === "Enter" && c.active >= 0) {
    e.preventDefault();
    c.select(c.active);
  }
}

export function useDropdownKeys(c: KeyContext) {
  const { visible, query, last, active, close, openDropdown, select, setActive } = c;
  return useCallback(
    (e: KeyboardEvent) =>
      handleDropdownKey(e, { visible, query, last, active, close, openDropdown, select, setActive }),
    [visible, query, last, active, close, openDropdown, select, setActive],
  );
}
