import { useCallback, useEffect, useRef, useState } from "react";
import { ATLAS_EMPTY_SET } from "@/lib/atlasHelpers";
import { addedAll, removedAll } from "../../lib/setOps";

// Must outlast the 190ms exit keyframes in index.css plus a frame or two, or the row jumps on unmount.
export const EXIT_MS = 240;

// `height: auto` gives the exit keyframes nothing to collapse from, so pin the measured height.
function pinExitHeights(ids: string[]): void {
  for (const nid of ids) {
    const el = document.getElementById(nid);
    if (el) el.style.setProperty("--exit-h", `${el.offsetHeight}px`);
  }
}

// Driven by the collapse action, not a render diff: re-adding unmounted rows would replay their entrance.
export function useExitingRows(hiddenNodeIds: ReadonlySet<string>): {
  exitingIds: ReadonlySet<string>;
  markExiting: (ids: string[]) => void;
} {
  const [exitingIds, setExitingIds] = useState<ReadonlySet<string>>(ATLAS_EMPTY_SET);
  // One timer per batch so overlapping collapses don't cancel each other's fade.
  const exitTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => () => { for (const t of exitTimersRef.current) clearTimeout(t); }, []);
  // Ref keeps markExiting stable; it feeds the shared actions object.
  const hiddenNodeIdsRef = useRef(hiddenNodeIds);
  hiddenNodeIdsRef.current = hiddenNodeIds;
  const markExiting = useCallback((ids: string[]) => {
    const leaving = ids.filter((nid) => !hiddenNodeIdsRef.current.has(nid));
    // Reduced motion skips it entirely: an instant fade would still hold layout space for EXIT_MS.
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
