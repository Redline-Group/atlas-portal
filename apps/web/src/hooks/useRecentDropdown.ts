import { useCallback, useEffect, useRef, useState } from "react";
import { refreshRecent } from "../lib/recentSearches";
import { useDropdownKeys } from "./recentDropdownKeys";

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

// Open/close, highlight and focus-timing state. The highlight resets whenever
// the query changes under it.
function useDropdownState(query: string) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // -1 = no highlight, focus on input
  // The input is autoFocus'd on load; swallow that one mount focus so the
  // dropdown never opens on first paint — only a deliberate focus/click does.
  const skipMountFocus = useRef(true);
  // Blur hides on a delay; if the input refocuses within it, cancel the hide so
  // a transient blur (e.g. a re-render stealing focus) can't strand the state.
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the highlight whenever the visible suggestion set changes under it.
  useEffect(() => setActive(-1), [query]);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const openDropdown = useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    refreshRecent(); // prune anything past the TTL
    setOpen(true);
  }, []);

  const onFocus = useCallback(() => {
    if (!skipMountFocus.current) openDropdown();
    skipMountFocus.current = false;
  }, [openDropdown]);

  const onBlur = useCallback(() => void (blurTimer.current = setTimeout(close, 120)), [close]);

  return { open, active, setActive, close, openDropdown, onFocus, onBlur };
}

function useSelect(suggestions: string[], onSelect: Args["onSelect"], close: () => void) {
  return useCallback(
    (i: number) => {
      const q = suggestions[i];
      if (q === undefined || !onSelect) return;
      close();
      onSelect(q, i);
    },
    [suggestions, onSelect, close],
  );
}

export function useRecentDropdown({ suggestions, query, onSelect }: Args) {
  const { open, active, setActive, close, openDropdown, onFocus, onBlur } = useDropdownState(query);
  const visible = open && suggestions.length > 0;

  const select = useSelect(suggestions, onSelect, close);
  const onKeyDown = useDropdownKeys({
    visible,
    query,
    last: suggestions.length - 1,
    active,
    close,
    openDropdown,
    select,
    setActive,
  });

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
