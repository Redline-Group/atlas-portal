import { useCallback } from "react";
import { track } from "../../lib/analytics";
import type { SplitOpenVia } from "../../hooks/useSplitPane";

/** Selects a doc in the main reader from the comparison pane (a shift-click on
 *  a pane row, or via "link" on a doc link in it), and records it. The current
 *  doc and pane are read from the URL at click time, so the callback keeps one
 *  identity across navigation. */
export function useShowInMain(navigate: (id: string) => void) {
  return useCallback(
    (target: string, via: SplitOpenVia | "row" = "row") => {
      const live = new URLSearchParams(window.location.search);
      track("reader_split_show_in_main", { node_id: live.get("id"), split_id: live.get("split"), target_id: target, via });
      navigate(target);
    },
    [navigate],
  );
}
