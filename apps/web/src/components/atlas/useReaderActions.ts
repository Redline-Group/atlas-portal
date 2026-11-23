import { useCallback, useMemo } from "react";
import { collectSubtree, type LoadedData } from "@/lib/atlasHelpers";
import { useSelection } from "../../lib/selection";
import { useAtlasActions } from "./AtlasActionsContext";

// Memoized: a fresh object would re-render every memo'd CollapsibleNode on any parent render.
export function useReaderActions(
  data: LoadedData,
  toggle: (nodeId: string) => void,
  pendulum: (rootId: string, opts?: { reverse?: boolean }) => void,
) {
  const { navigate, splitNavigate } = useAtlasActions();
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
