import { useCallback, useEffect, useRef, useState } from "react";
import { ATLAS_EMPTY_SET } from "@/lib/atlasHelpers";
import { addedAll, removedAll } from "../../lib/setOps";

// How long a collapsing row stays mounted and inert before it is removed from
// the DOM for real. Must outlast the exit keyframes in index.css (190ms) plus
// the frame or two they take to start: the animation ends at height 0 and holds
// there, so once it has finished the row occupies nothing and the unmount is
// invisible. Cut it short and the row is pulled while it still has height —
// which is exactly the jump this exists to remove.
export const EXIT_MS = 240;

// Pin each row's current height for the exit keyframes to collapse FROM.
// Measured while the rows are still laid out — the re-render after the rung
// write is what removes them — and because `height: auto` gives the animation
// nothing to start at.
function pinExitHeights(ids: string[]): void {
  for (const nid of ids) {
    const el = document.getElementById(nid);
    if (el) el.style.setProperty("--exit-h", `${el.offsetHeight}px`);
  }
}

// Rows on their way out. A collapse would otherwise blink them away; keeping
// them mounted, inert and fading for EXIT_MS lets the removal read. Driven by
// the collapse ACTION rather than by diffing renders: the action knows the
// exact set leaving, and a diff computed after the fact would have to unmount
// the rows first and re-add them, which replays their ENTRANCE animation.
export function useExitingRows(hiddenNodeIds: ReadonlySet<string>): {
  exitingIds: ReadonlySet<string>;
  /** Starts the exit fade for whichever of `ids` are on screen right now. */
  markExiting: (ids: string[]) => void;
} {
  const [exitingIds, setExitingIds] = useState<ReadonlySet<string>>(ATLAS_EMPTY_SET);
  // One timer PER collapse batch, not a single shared slot: collapsing branch B
  // while branch A's rows are still fading must not cancel A's timer or drop
  // A's ids out of exitingIds — each batch owns its own timeout and only ever
  // removes its own ids, so overlapping collapses each get to finish their fade.
  const exitTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => () => { for (const t of exitTimersRef.current) clearTimeout(t); }, []);
  // hiddenNodeIds through a ref: markExiting runs inside a click handler and
  // must stay referentially stable (it feeds the shared actions object). The
  // ref still describes what the user can see when the click lands: rows
  // already hidden at some deeper rung have nothing to animate.
  const hiddenNodeIdsRef = useRef(hiddenNodeIds);
  hiddenNodeIdsRef.current = hiddenNodeIds;
  const markExiting = useCallback((ids: string[]) => {
    const leaving = ids.filter((nid) => !hiddenNodeIdsRef.current.has(nid));
    // Reduced motion skips the whole mechanism rather than fading instantly:
    // an instant fade would still hold the rows' layout space for EXIT_MS,
    // reading as a stall before the list closes up.
    if (!leaving.length || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    pinExitHeights(leaving);
    setExitingIds((prev) => addedAll(prev, leaving));
    const timer = setTimeout(() => {
      setExitingIds((prev) => removedAll(prev, leaving));
      exitTimersRef.current.delete(timer);
    }, EXIT_MS);
    exitTimersRef.current.add(timer);
  }, []);
  return { exitingIds, markExiting };
}
