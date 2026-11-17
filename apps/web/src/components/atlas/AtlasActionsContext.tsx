import { createContext, useCallback, useContext, type MouseEvent } from "react";
import type { SplitOpenVia } from "../../hooks/useSplitPane";

interface AtlasActions {
  navigate: (id: string) => void;
  toggle: (id: string) => void;
  /** What shift-clicking a doc does here: the main reader opens it in the
   *  comparison pane, the pane shows it in the main reader. Doc links pass
   *  via "link" (see useDocLinkShiftClick); rows pass nothing. */
  splitNavigate: (id: string, via?: SplitOpenVia) => void;
  /** The » click: advances a node's rung to the next pendulum position, or to
   *  the reversed one when alt is held (see subtreeState.ts). Only the main
   *  reader provides this; rows hide the affordance when it's absent. */
  pendulum?: (id: string, opts?: { reverse?: boolean }) => void;
  /** Select a node + all its descendants at once (shift-click on the row's
   *  selection checkbox). Only the main reader provides it. */
  selectSubtree?: (id: string) => void;
  /** doc_no → uuid, for the one place a row knows a doc by NUMBER rather than
   *  id: an annotation's "Annotates A.2.8" label, which links to its target.
   *  The map identity only changes when the atlas bundle does — the same moment
   *  every row's `entry` changes — so putting it here costs no extra renders.
   *  Optional: without it the label degrades to plain text. */
  docNoToId?: Map<string, string>;
}

export const AtlasActionsContext = createContext<AtlasActions | null>(null);

export function useAtlasActions(): AtlasActions {
  const ctx = useContext(AtlasActionsContext);
  if (!ctx) throw new Error("useAtlasActions must be used within AtlasActionsContext.Provider");
  return ctx;
}

const isShiftClick = (e: MouseEvent) => e.shiftKey && e.button === 0 && !(e.ctrlKey || e.metaKey || e.altKey);

/**
 * A doc link's shift-click inside the reader does what shift-clicking that
 * doc's row does — splitNavigate, so the direction follows whichever pane the
 * link renders in, portalled tooltips included. Outside the reader there is no
 * context and the browser keeps its own shift-click. Returns whether it took
 * the click; the caller skips its plain-click behaviour when it did.
 */
export function useDocLinkShiftClick(): (e: MouseEvent, id: string) => boolean {
  const splitNavigate = useContext(AtlasActionsContext)?.splitNavigate;
  return useCallback(
    (e: MouseEvent, id: string) => {
      if (!splitNavigate || !isShiftClick(e)) return false;
      e.preventDefault();
      splitNavigate(id, "link");
      return true;
    },
    [splitNavigate],
  );
}
