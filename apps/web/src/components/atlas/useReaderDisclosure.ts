import { useCallback, useMemo, type RefObject } from "react";
import type { FlatEntry, LoadedData } from "@/lib/atlasHelpers";
import { useExpandingAttr } from "../../hooks/useExpandingAttr";
import { buildVisualTree, hiddenByCollapse, visualSubtreeIds, type VisualTree } from "../../lib/visualTree";
import type { Rung } from "./subtreeState";
import { useBodyExpansion, type BodyExpansion } from "./useBodyExpansion";
import { useExitingRows } from "./useExitingRows";
import { useCollapseBranch, usePendulum } from "./usePendulum";
import { useRevealOnNavigate } from "./useRevealOnNavigate";
import { useRungs } from "./useRungs";

type WriteRungs = (updates: Iterable<[string, Rung]>) => void;

/** What the reader currently discloses, and the gestures that change it. */
export interface ReaderDisclosure {
  rung: ReadonlyMap<string, Rung>;
  bodies: BodyExpansion;
  tree: VisualTree;
  /** Every row hidden by a collapsed ancestor. */
  hiddenNodeIds: ReadonlySet<string>;
  /** Rows a collapse is fading out; still mounted. */
  exitingIds: ReadonlySet<string>;
  pendulum: (rootId: string, opts?: { reverse?: boolean }) => void;
  expandHidden: (nodeId: string) => void;
}

// The "N hidden" tab reveals every row beneath the node, left collapsed
// (bodies closed): every member of the visual span that itself has visual
// children is raised to rung 1 in one write. The root gets dir: -1 so the
// very next chevron click on it undoes the reveal in a single click instead
// of three; descendants get the ordinary forward direction.
function useExpandHidden(flatNodes: FlatEntry[], tree: VisualTree, writeRungs: WriteRungs, armReveal: () => void) {
  return useCallback((nodeId: string) => {
    const updates: [string, Rung][] = [];
    for (const memberId of [nodeId, ...visualSubtreeIds(flatNodes, nodeId)]) {
      if (!tree.children.has(memberId)) continue;
      updates.push([memberId, { level: 1, dir: memberId === nodeId ? -1 : 1 }]);
    }
    writeRungs(updates);
    armReveal();
  }, [flatNodes, tree, writeRungs, armReveal]);
}

export interface ReaderDisclosureInput {
  id: string;
  selectedId: string | null;
  data: LoadedData;
  /** A flat filtered view is active (see PendulumDeps.flat). */
  flat: boolean;
  scrollContainerRef: RefObject<HTMLElement | null>;
}

// Composes the reader's disclosure state: the per-node rung map (which
// children rows show), body expansion, the visual tree both are walked over,
// and the pendulum / "N hidden" gestures that write them.
export function useReaderDisclosure(input: ReaderDisclosureInput): ReaderDisclosure {
  const { id, selectedId, data, flat, scrollContainerRef } = input;
  const { flatNodes } = data;
  const { rung, rungRef, writeRungs, revealTo } = useRungs();
  const bodies = useBodyExpansion(id, data);
  const tree = useMemo(() => buildVisualTree(flatNodes), [flatNodes]);
  const selfCollapsedRef = useRevealOnNavigate(id, flatNodes, revealTo);
  // THE single "is this row's children hidden" predicate: absent rung (or
  // rung 0) means the chevron is up and the immediate children's rows don't
  // render.
  const hiddenNodeIds = useMemo(
    () => hiddenByCollapse(flatNodes, (nodeId) => (rung.get(nodeId)?.level ?? 0) === 0),
    [flatNodes, rung],
  );
  const { exitingIds, markExiting } = useExitingRows(hiddenNodeIds);
  // Arms the reveal animation: flips `data-expanding` on the scroll container
  // for a beat, which is what lets newly inserted rows and bodies run their
  // @starting-style entrance (see index.css). The window MUST outlast the
  // longest entrance in index.css (currently the 280ms row fade) plus the
  // two-frame commit deferral in ChevronFeedback (lib/chevronFeedback.ts). Removing the attribute
  // mid-transition stops `[data-expanding]` matching, which drops the
  // transition declaration and snaps the element to its end state — the
  // animation would silently truncate rather than fail loudly.
  const armReveal = useExpandingAttr(scrollContainerRef, 450);
  const collapseBranch = useCollapseBranch(flatNodes, selectedId, markExiting, selfCollapsedRef);
  const { setBodiesExpanded } = bodies;
  const pendulum = usePendulum({
    rungRef, writeRungs, visualChildren: tree.children, flat, armReveal, setBodiesExpanded, collapseBranch,
  });
  const expandHidden = useExpandHidden(flatNodes, tree, writeRungs, armReveal);
  return { rung, bodies, tree, hiddenNodeIds, exitingIds, pendulum, expandHidden };
}
