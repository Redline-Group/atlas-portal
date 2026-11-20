import { useCallback, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { recentKeyAction } from "./recentDropdownKeys";
import { useDropdownOpen } from "./useDropdownOpen";

// Open/close + keyboard state for the recent-searches dropdown. Implements the
// ARIA combobox + listbox pattern: DOM focus stays on the input the whole time
// and a highlighted option is tracked with `active` (surfaced as
// aria-activedescendant), so the dropdown stays open while the user arrows
// through it. Tab selects the first option, Up/Down move the highlight, Enter
// runs the highlighted suggestion, Escape closes.

interface Args {
  suggestions: string[];
  query: string;
  onSelect?: (query: string, rank: number) => void;
}

export function useRecentDropdown({ suggestions, query, onSelect }: Args) {
  const { open, active, setActive, close, openDropdown, onFocus, onBlur } = useDropdownOpen();

  // Reset the highlight whenever the visible suggestion set changes under it.
  useEffect(() => setActive(-1), [query, setActive]);

  const visible = open && suggestions.length > 0;

  const select = useCallback(
    (i: number) => {
      const q = suggestions[i];
      if (q === undefined || !onSelect) return;
      close();
      onSelect(q, i);
    },
    [suggestions, onSelect, close],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const action = recentKeyAction(e, { visible, query, active, last: suggestions.length - 1 });
      if (action.kind === "close") close();
      else if (action.kind === "open") openDropdown();
      else if (action.kind === "highlight") {
        e.preventDefault();
        setActive(action.next);
      } else if (action.kind === "select") {
        e.preventDefault();
        select(action.index);
      }
    },
    [visible, query, suggestions.length, active, close, openDropdown, select, setActive],
  );

  // Mouse hover writes the same `active` index the keyboard uses, so the two
  // can never both highlight a row — whichever moved last wins. setActive bails
  // on an unchanged value, so firing this on every mousemove is cheap.
  const onOptionHover = useCallback((i: number) => setActive(i), [setActive]);

  return {
    visible,
    active,
    select,
    onOptionHover,
    handlers: { onFocus, onPointerDown: openDropdown, onBlur, onKeyDown },
  };
}
