import { useEffect, useRef, type RefObject } from "react";
import type { FlatEntry } from "@/lib/atlasHelpers";
import { visualAncestorIds } from "../../lib/visualTree";
import type { RungLevel } from "./subtreeState";

// A doc reached from the sidebar (or any in-app link) may live inside a
// collapsed branch. Navigating to it must reveal it AND its siblings: walk
// its VISUAL ancestor chain and raise each ancestor to at least rung 1 —
// revealTo is monotonic and idempotent, so this never lowers a rung or
// touches body state. Visual (not parentId) so it also reveals rows the
// heading-depth cap reparented, where a parentId walk would open the wrong
// branch.
//
// Returns the self-collapse guard: a collapse that moves the selection onto
// the branch root it just closed writes that root's id here first, so this
// effect does not instantly re-open the branch the click just closed.
export function useRevealOnNavigate(
  id: string,
  flatNodes: FlatEntry[],
  revealTo: (ids: string[], minLevel: RungLevel) => void,
): RefObject<string | null> {
  const selfCollapsedRef = useRef<string | null>(null);
  // Last id a reveal actually completed for — guards a same-id re-fire (the
  // docs-deep phase-2 swap) from re-raising a rung the user just collapsed on
  // the current selection.
  const revealedForIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!id) return;
    // Once we've navigated away from the branch a pendulum click just
    // self-collapsed, the guard below has done its job — clear it so a
    // LATER, unrelated return to the same id behaves like an ordinary fresh
    // navigation (raises the target's rung again).
    if (selfCollapsedRef.current && selfCollapsedRef.current !== id) {
      selfCollapsedRef.current = null;
    }
    const ancestors = visualAncestorIds(flatNodes, id);
    if (!ancestors) return;
    revealTo(ancestors, 1);
    // Raising the TARGET itself to rung 1 is what makes a deep link show its
    // children's titles on arrival. Guarded against two self-undo loops:
    //   - a pendulum click that just collapsed this exact id and moved
    //     selection onto it (selfCollapsedRef) — re-raising would instantly
    //     reopen what the click just closed.
    //   - a same-id re-fire from the docs-deep phase-2 swap (revealedForIdRef)
    //     — without it, the phase-2 pass would re-raise a rung the user just
    //     closed on the current selection.
    // Set AFTER the no-row bail (not before): the phase-1 run (docs-shallow,
    // target not yet loaded) bails without recording, so the phase-2 run is
    // the first SUCCESSFUL one and still raises the target — that's what
    // keeps deep links to depth-6+ docs working.
    if (revealedForIdRef.current !== id && selfCollapsedRef.current !== id) {
      revealTo([id], 1);
    }
    revealedForIdRef.current = id;
  }, [id, flatNodes, revealTo]);
  return selfCollapsedRef;
}
