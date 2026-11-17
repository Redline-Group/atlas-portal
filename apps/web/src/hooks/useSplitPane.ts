import { useCallback, useRef } from "react";
import { track } from "../lib/analytics";
import { useUrlState, urlString } from "./useUrlState";

const splitCodec = urlString(null);

/** How the pane was opened, when it was not a row or the split button. */
export type SplitOpenVia = "link";

/** Opens the comparison pane on a doc, or closes it with null. */
export type SplitChange = (id: string | null, via?: SplitOpenVia) => void;

/** The reader's comparison pane. It lives in ?split=<uuid> so shift-click and
 *  back/forward restore the same side-by-side view and the URL is shareable.
 *  The URL is the only state, so every caller sees the same pane. */
export function useSplitPane(nodeId: string | null) {
  const [splitId, setSplitId] = useUrlState("split", splitCodec);

  // Read through a ref so the callback keeps one identity across navigation:
  // it feeds the pane's actions context and chat's citation handler, whose
  // consumers would otherwise all re-render on every doc click.
  const live = useRef({ splitId, nodeId });
  live.current = { splitId, nodeId };

  // Opening and closing are tracked on the null ↔ uuid transitions only.
  const handleSplitChange = useCallback<SplitChange>(
    (sid, via) => {
      const { splitId: open, nodeId: node } = live.current;
      if (sid && sid !== open) track("atlas_split_open", { node_id: node, split_id: sid, ...(via && { via }) });
      else if (!sid && open) track("reader_split_close", { node_id: node, split_id: open });
      setSplitId(sid);
    },
    [setSplitId],
  );

  return { splitId, handleSplitChange };
}
