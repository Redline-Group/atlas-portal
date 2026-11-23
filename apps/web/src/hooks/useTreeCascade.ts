import { useCallback, useEffect, useRef } from "react";
import type { AtlasBundle } from "../lib/docs";
import { addedAll } from "../lib/setOps";
import { CASCADE_LEVELS } from "../lib/treeCascade";
import { withoutSubtree } from "../lib/treeExpansion";
import type { SetExpandedIds } from "./useTreeExpansion";

const REVEAL_STEP_MS = 180;

type Timer = { current: ReturnType<typeof setTimeout> | null };

interface Run {
  byParent: AtlasBundle["byParent"];
  follow: (childId: string) => boolean;
  maxLevels: number;
  setExpandedIds: SetExpandedIds;
  timer: Timer;
}

// One tick of the unfold: expand `frontier`, then queue the children that
// continue it. `frontier` is a parameter this tick never reassigns, because
// React can defer invoking a functional setState updater until after this
// synchronous block finishes — the updater must close over a value that never
// changes out from under it.
function unfold(run: Run, frontier: string[], level: number): void {
  run.setExpandedIds((prev) => addedAll(prev, frontier));
  const nextFrontier: string[] = [];
  if (level + 1 < run.maxLevels) {
    for (const cur of frontier) {
      for (const child of run.byParent.get(cur) ?? []) {
        if (run.follow(child.id)) nextFrontier.push(child.id);
      }
    }
  }
  run.timer.current = nextFrontier.length
    ? setTimeout(() => unfold(run, nextFrontier, level + 1), REVEAL_STEP_MS)
    : null;
}

// Staggered BFS unfold, one level per REVEAL_STEP_MS tick (not all at once)
// so the cascade is legible — each level appears, lingers, then the next
// unfolds. `follow` decides which children continue the frontier; `maxLevels`
// caps how many ticks run (the first tick expands `rootId` itself, so
// maxLevels = 4 means 4 ticks). Shared by the preview rollup reveal and the
// sidebar chevron's shift-click cascade. `cancel` stops a run in flight.
function useStaggeredUnfold(bundle: AtlasBundle | null, setExpandedIds: SetExpandedIds) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const cascade = useCallback(
    (rootId: string, follow: Run["follow"], maxLevels: number) => {
      if (!bundle) return;
      if (timer.current) clearTimeout(timer.current);
      unfold({ byParent: bundle.byParent, follow, maxLevels, setExpandedIds, timer }, [rootId], 0);
    },
    [bundle, setExpandedIds],
  );
  return { cascade, cancel };
}

/** The bulk expansion gestures, each acting on the subtree under one row. */
export function useTreeCascade(
  bundle: AtlasBundle | null,
  setExpandedIds: SetExpandedIds,
  rollup: ReadonlyMap<string, unknown>,
) {
  const { cascade, cancel } = useStaggeredUnfold(bundle, setExpandedIds);

  // Expand from `id` down through every node that has a changed descendant
  // (rollup keys), revealing the changes without unfolding unrelated subtrees.
  // Changed leaves become visible once their (rollup-key) parent is expanded.
  const revealChanges = useCallback(
    (id: string) => cascade(id, (cid) => rollup.has(cid), Infinity),
    [cascade, rollup],
  );

  // Shift-click on a collapsed chevron: unfold the next few levels of the real
  // tree, regardless of rollup membership. The cap is the third argument below.
  const cascadeLevels = useCallback(
    (id: string) => cascade(id, (cid) => !!bundle?.byParent.has(cid), CASCADE_LEVELS),
    [cascade, bundle],
  );

  // Shift-click on an already-open chevron: the mirror image — collapse the row
  // and every descendant under it in one step, so the branch you unfolded with
  // one gesture folds back with the same one. Instant rather than staggered:
  // there is nothing to read on the way down, and a staggered collapse would
  // just make the row you are aiming at move.
  const collapseSubtree = useCallback(
    (id: string) => {
      cancel();
      setExpandedIds((prev) => withoutSubtree(prev, bundle?.byParent, id));
    },
    [bundle, cancel, setExpandedIds],
  );

  return { revealChanges, cascadeLevels, collapseSubtree };
}
