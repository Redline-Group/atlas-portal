import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { FlatEntry } from "@/lib/atlasHelpers";
import { revealStore } from "../../lib/revealStore";
import { visualSubtreeIds } from "../../lib/visualTree";
import { useAtlasActions } from "./AtlasActionsContext";
import { DEFAULT_RUNG, swingRung, type Rung, type RungLevel } from "./subtreeState";

type SetBodiesExpanded = (ids: string[], expand: boolean) => void;

// A selection inside the collapsed subtree moves to its root; selfCollapsedRef stops that navigation re-opening it.
export function useCollapseBranch(
  flatNodes: FlatEntry[],
  selectedId: string | null,
  markExiting: (ids: string[]) => void,
  selfCollapsedRef: RefObject<string | null>,
): (rootId: string) => void {
  const { navigate } = useAtlasActions();
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  });
  return useCallback((rootId: string) => {
    const subtreeIds = visualSubtreeIds(flatNodes, rootId);
    markExiting(subtreeIds);
    const sel = selectedIdRef.current;
    if (sel && sel !== rootId && subtreeIds.includes(sel)) {
      selfCollapsedRef.current = rootId;
      navigate(rootId);
    }
  }, [flatNodes, markExiting, selfCollapsedRef, navigate]);
}

function discloseLevel(rootId: string, from: RungLevel, to: RungLevel, children: string[], setBodies: SetBodiesExpanded) {
  if (to === 1) {
    // Only 2 → 1 closes the root's own body; on 0 → 1 it would shut the doc being read.
    setBodies(from === 2 ? [rootId, ...children] : children, false);
    if (from === 0) revealStore.reveal(children);
    return;
  }
  setBodies([rootId, ...children], true);
  revealStore.reveal(children);
}

export interface PendulumDeps {
  rungRef: RefObject<ReadonlyMap<string, Rung>>;
  writeRungs: (updates: Iterable<[string, Rung]>) => void;
  visualChildren: ReadonlyMap<string, string[]>;
  flat: boolean;
  armReveal: () => void;
  setBodiesExpanded: SetBodiesExpanded;
  collapseBranch: (rootId: string) => void;
}

// Level 0 writes no bodies: collapsing preserves the descendants' shape, the point of storing rung.
export function usePendulum(deps: PendulumDeps): (rootId: string, opts?: { reverse?: boolean }) => void {
  const { rungRef, writeRungs, visualChildren, flat, armReveal, setBodiesExpanded, collapseBranch } = deps;
  // Refs, not deps: churn here re-renders every memo'd row via the actions context.
  const flatRef = useRef(false);
  useEffect(() => {
    flatRef.current = flat;
  });
  const armRevealRef = useRef(armReveal);
  armRevealRef.current = armReveal;

  return useCallback((rootId: string, opts?: { reverse?: boolean }) => {
    const cur = rungRef.current.get(rootId) ?? DEFAULT_RUNG;
    const next = swingRung(cur, { flat: flatRef.current, reverse: opts?.reverse });
    if (next.level > cur.level) armRevealRef.current();
    writeRungs([[rootId, next]]);
    if (next.level === 0) collapseBranch(rootId);
    else discloseLevel(rootId, cur.level, next.level, visualChildren.get(rootId) ?? [], setBodiesExpanded);
  }, [rungRef, writeRungs, visualChildren, setBodiesExpanded, collapseBranch]);
}
