// What a key press on the recent-searches combobox input does. Pure: the hook
// applies the action, and calls preventDefault for the two kinds that claim
// the key (`highlight`, `select`).
export type RecentKeyAction =
  | { kind: "none" }
  | { kind: "close" }
  | { kind: "open" }
  | { kind: "highlight"; next: (active: number) => number }
  | { kind: "select"; index: number };

interface KeyPress {
  key: string;
  shiftKey: boolean;
}

interface DropdownState {
  /** The dropdown is open and has at least one suggestion. */
  visible: boolean;
  query: string;
  /** Highlighted option, -1 for none. */
  active: number;
  /** Index of the last suggestion. */
  last: number;
}

const NONE: RecentKeyAction = { kind: "none" };

export function recentKeyAction(e: KeyPress, s: DropdownState): RecentKeyAction {
  if (e.key === "Escape") return { kind: "close" };
  if (!s.visible) {
    // Re-summon by pressing Backspace/Delete on an already-empty field.
    const erasing = e.key === "Backspace" || e.key === "Delete";
    return erasing && s.query.trim() === "" ? { kind: "open" } : NONE;
  }
  if (e.key === "ArrowDown") return { kind: "highlight", next: (a) => Math.min(a + 1, s.last) };
  if (e.key === "ArrowUp") return { kind: "highlight", next: (a) => Math.max(a - 1, -1) };
  // Tab steps into the dropdown so Enter runs the first suggestion.
  if (e.key === "Tab" && !e.shiftKey && s.active === -1) return { kind: "highlight", next: () => 0 };
  if (e.key === "Enter" && s.active >= 0) return { kind: "select", index: s.active };
  return NONE;
}
