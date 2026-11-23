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

// `frontier` is never reassigned: React may run the setState updater after this block returns.
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

// Staggered BFS, one level per tick so the cascade is legible; the first tick expands `rootId` itself.
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

export function useTreeCascade(
  bundle: AtlasBundle | null,
  setExpandedIds: SetExpandedIds,
  rollup: ReadonlyMap<string, unknown>,
) {
  const { cascade, cancel } = useStaggeredUnfold(bundle, setExpandedIds);

  const revealChanges = useCallback(
    (id: string) => cascade(id, (cid) => rollup.has(cid), Infinity),
    [cascade, rollup],
  );

  const cascadeLevels = useCallback(
    (id: string) => cascade(id, (cid) => !!bundle?.byParent.has(cid), CASCADE_LEVELS),
    [cascade, bundle],
  );

  // Instant, not staggered: a staggered collapse would move the row you are aiming at.
  const collapseSubtree = useCallback(
    (id: string) => {
      cancel();
      setExpandedIds((prev) => withoutSubtree(prev, bundle?.byParent, id));
    },
    [bundle, cancel, setExpandedIds],
  );

  return { revealChanges, cascadeLevels, collapseSubtree };
}
