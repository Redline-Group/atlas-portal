import { useCallback, useMemo } from "react";
import { collectSubtree, type LoadedData } from "@/lib/atlasHelpers";
import { useSelection } from "../../lib/selection";
import { useAtlasActions } from "./AtlasActionsContext";

// The actions-context value the main reader provides to its rows: the
// surrounding navigate / splitNavigate plus the reader's own body toggle,
// pendulum and subtree selection.
//
// Stable value: rebuilding it every render forces every memo'd CollapsibleNode
// to re-render on any parent render (e.g. a selection change or an ordinary
// body toggle). All members are referentially stable across those renders —
// the pendulum reads rung/selection state through refs rather than closing
// over it — so the object is memoized too.
export function useReaderActions(
  data: LoadedData,
  toggle: (nodeId: string) => void,
  pendulum: (rootId: string, opts?: { reverse?: boolean }) => void,
) {
  const { navigate, splitNavigate } = useAtlasActions();
  // Shift-clicking a doc's selection checkbox selects it + all descendants.
  const { selectSubtree } = useSelection();
  const handleSelectSubtree = useCallback((rootId: string) => {
    selectSubtree(collectSubtree(data.atlas.byParent, rootId));
  }, [selectSubtree, data]);
  const { docNoToId } = data.atlas;
  return useMemo(
    () => ({ navigate, toggle, splitNavigate, pendulum, selectSubtree: handleSelectSubtree, docNoToId }),
    [navigate, toggle, splitNavigate, pendulum, handleSelectSubtree, docNoToId],
  );
}
