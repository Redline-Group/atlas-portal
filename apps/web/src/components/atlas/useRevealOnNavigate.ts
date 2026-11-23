import { useEffect, useRef, type RefObject } from "react";
import type { FlatEntry } from "@/lib/atlasHelpers";
import { visualAncestorIds } from "../../lib/visualTree";
import type { RungLevel } from "./subtreeState";

// Walks VISUAL ancestors, not parentId, so rows reparented by the heading-depth cap open the right branch.
export function useRevealOnNavigate(
  id: string,
  flatNodes: FlatEntry[],
  revealTo: (ids: string[], minLevel: RungLevel) => void,
): RefObject<string | null> {
  const selfCollapsedRef = useRef<string | null>(null);
  const revealedForIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!id) return;
    if (selfCollapsedRef.current && selfCollapsedRef.current !== id) {
      selfCollapsedRef.current = null;
    }
    const ancestors = visualAncestorIds(flatNodes, id);
    if (!ancestors) return;
    revealTo(ancestors, 1);
    // Guards: a self-collapse onto this id, and the docs-deep phase-2 re-fire, would reopen a closed branch.
    // Recorded after the no-row bail so the phase-2 run still raises deep-linked depth-6+ targets.
    if (revealedForIdRef.current !== id && selfCollapsedRef.current !== id) {
      revealTo([id], 1);
    }
    revealedForIdRef.current = id;
  }, [id, flatNodes, revealTo]);
  return selfCollapsedRef;
}
