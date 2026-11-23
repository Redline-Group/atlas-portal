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

export interface ReaderDisclosure {
  rung: ReadonlyMap<string, Rung>;
  bodies: BodyExpansion;
  tree: VisualTree;
  hiddenNodeIds: ReadonlySet<string>;
  exitingIds: ReadonlySet<string>;
  pendulum: (rootId: string, opts?: { reverse?: boolean }) => void;
  expandHidden: (nodeId: string) => void;
}

// The root gets dir: -1 so one chevron click undoes the reveal instead of three.
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
  flat: boolean;
  scrollContainerRef: RefObject<HTMLElement | null>;
}

export function useReaderDisclosure(input: ReaderDisclosureInput): ReaderDisclosure {
  const { id, selectedId, data, flat, scrollContainerRef } = input;
  const { flatNodes } = data;
  const { rung, rungRef, writeRungs, revealTo } = useRungs();
  const bodies = useBodyExpansion(id, data);
  const tree = useMemo(() => buildVisualTree(flatNodes), [flatNodes]);
  const selfCollapsedRef = useRevealOnNavigate(id, flatNodes, revealTo);
  const hiddenNodeIds = useMemo(
    () => hiddenByCollapse(flatNodes, (nodeId) => (rung.get(nodeId)?.level ?? 0) === 0),
    [flatNodes, rung],
  );
  const { exitingIds, markExiting } = useExitingRows(hiddenNodeIds);
  // Must outlast the 280ms row entrance plus ChevronFeedback's two-frame deferral, or the transition snaps.
  const armReveal = useExpandingAttr(scrollContainerRef, 450);
  const collapseBranch = useCollapseBranch(flatNodes, selectedId, markExiting, selfCollapsedRef);
  const { setBodiesExpanded } = bodies;
  const pendulum = usePendulum({
    rungRef, writeRungs, visualChildren: tree.children, flat, armReveal, setBodiesExpanded, collapseBranch,
  });
  const expandHidden = useExpandHidden(flatNodes, tree, writeRungs, armReveal);
  return { rung, bodies, tree, hiddenNodeIds, exitingIds, pendulum, expandHidden };
}
