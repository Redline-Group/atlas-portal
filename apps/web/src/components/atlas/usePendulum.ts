import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { FlatEntry } from "@/lib/atlasHelpers";
import { revealStore } from "../../lib/revealStore";
import { visualSubtreeIds } from "../../lib/visualTree";
import { useAtlasActions } from "./AtlasActionsContext";
import { DEFAULT_RUNG, swingRung, type Rung, type RungLevel } from "./subtreeState";

type SetBodiesExpanded = (ids: string[], expand: boolean) => void;

// Collapsing hides the WHOLE visual subtree, not just the immediate children:
// its on-screen rows fade out, and if the selection sits anywhere inside it,
// it would vanish — so it moves onto the branch root itself (the row whose
// chevron was clicked) and focus lands on the collapsed row instead of
// disappearing. `selfCollapsedRef` is useRevealOnNavigate's guard against
// that navigation re-opening the branch.
export function useCollapseBranch(
  flatNodes: FlatEntry[],
  selectedId: string | null,
  markExiting: (ids: string[]) => void,
  selfCollapsedRef: RefObject<string | null>,
): (rootId: string) => void {
  const { navigate } = useAtlasActions();
  // Latest-value ref read inside the click handler, so the callback stays
  // referentially stable across ordinary navigation.
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

// Forces bodies to match a swing that leaves the branch open — level 2 opens
// the clicked doc's own body AND its immediate children's, the 2 → 1 swing
// back closes that same set.
function discloseLevel(rootId: string, from: RungLevel, to: RungLevel, children: string[], setBodies: SetBodiesExpanded) {
  if (to === 1) {
    // Closing the root's OWN body belongs only to the 2 → 1 swing, which
    // undoes the level-2 open. Doing it on 0 → 1 as well would slam shut the
    // body of the doc you are reading the moment you ask to see its children.
    setBodies(from === 2 ? [rootId, ...children] : children, false);
    // Only the 0 → 1 swing also asks the sidebar to reveal the children —
    // level 2 already does this on its own outward swing, and would
    // otherwise be the only rung that ever syncs the sidebar.
    if (from === 0) revealStore.reveal(children);
    return;
  }
  // to === 2: the clicked doc's own body opens alongside its children's —
  // "show the bodies" means this doc too, not just what is under it.
  setBodies([rootId, ...children], true);
  revealStore.reveal(children);
}

export interface PendulumDeps {
  rungRef: RefObject<ReadonlyMap<string, Rung>>;
  writeRungs: (updates: Iterable<[string, Rung]>) => void;
  /** Each node's immediate on-screen children (VisualTree.children). */
  visualChildren: ReadonlyMap<string, string[]>;
  /** True whenever a flat filtered view (selected-only or changed-only) is
   *  active, where rung 0 is invisible (the flat list never hides a row for
   *  it) — the pendulum swings between 1/2 only there instead of the ordinary
   *  3-position hidden/titles/bodies cycle. See flatNextRung. */
  flat: boolean;
  /** Arms the reveal animation for rows and bodies about to be inserted. */
  armReveal: () => void;
  setBodiesExpanded: SetBodiesExpanded;
  collapseBranch: (rootId: string) => void;
}

// The » click: advances rootId's rung to the next pendulum position (alt-click
// swings the other way — see reverseRung) and forces bodies to match. Level 0
// writes no bodies at all: collapsing preserves whatever shape the descendants
// were left in, which is the whole point of storing rung instead of deriving it.
export function usePendulum(deps: PendulumDeps): (rootId: string, opts?: { reverse?: boolean }) => void {
  const { rungRef, writeRungs, visualChildren, flat, armReveal, setBodiesExpanded, collapseBranch } = deps;
  // `flat` and `armReveal` are read through refs, NOT as dependencies. The
  // returned callback feeds the actions-context object that every memo'd row
  // consumes, so anything in its dep array that churns re-renders all ~1200
  // rows on an unrelated body toggle. The reads happen in a click handler,
  // long after render, so they are always current.
  const flatRef = useRef(false);
  useEffect(() => {
    flatRef.current = flat;
  });
  const armRevealRef = useRef(armReveal);
  armRevealRef.current = armReveal;

  return useCallback((rootId: string, opts?: { reverse?: boolean }) => {
    const cur = rungRef.current.get(rootId) ?? DEFAULT_RUNG;
    const next = swingRung(cur, { flat: flatRef.current, reverse: opts?.reverse });
    // Only the OUTWARD swings insert anything: 0 → 1 adds the child rows, 1 → 2
    // adds their bodies, and the alt jump 0 → 2 adds both at once. Arm the
    // reveal animation for those, so each step of the ladder visibly arrives
    // instead of blinking into place. The inward swings only remove nodes,
    // where the attribute would be inert anyway.
    if (next.level > cur.level) armRevealRef.current();
    writeRungs([[rootId, next]]);
    if (next.level === 0) collapseBranch(rootId);
    else discloseLevel(rootId, cur.level, next.level, visualChildren.get(rootId) ?? [], setBodiesExpanded);
  }, [rungRef, writeRungs, visualChildren, setBodiesExpanded, collapseBranch]);
}
