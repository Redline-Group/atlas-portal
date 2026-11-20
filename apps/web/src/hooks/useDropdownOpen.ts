import { useCallback, useRef, useState } from "react";
import { refreshRecent } from "../lib/recentSearches";

// Open/close state for the recent-searches dropdown, plus the highlighted
// option index that closing resets. The focus and blur handlers belong on the
// combobox input, which keeps DOM focus the whole time.
export function useDropdownOpen() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // -1 = no highlight, focus on input
  // The input is autoFocus'd on load; swallow that one mount focus so the
  // dropdown never opens on first paint — only a deliberate focus/click does.
  const skipMountFocus = useRef(true);
  // Blur hides on a delay; if the input refocuses within it, cancel the hide so
  // a transient blur (e.g. a re-render stealing focus) can't strand the state.
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (skipMountFocus.current) {
      skipMountFocus.current = false;
      return;
    }
    openDropdown();
  }, [openDropdown]);

  const onBlur = useCallback(() => void (blurTimer.current = setTimeout(close, 120)), [close]);

  return { open, active, setActive, close, openDropdown, onFocus, onBlur };
}
