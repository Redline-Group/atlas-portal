import { useMemo } from "react";
import { useLocation } from "wouter";
import { ROUTES } from "@/lib/routes";
import { useAtlasNodeId } from "../../hooks/useAtlasNodeId";
import { useSplitPane } from "../../hooks/useSplitPane";

const noop = () => {};

/**
 * The reader's actions for chat's citation links (AtlasActionsContext). On the
 * reader a citation's shift-click opens the comparison pane, as any doc link
 * there does (useDocLinkShiftClick). Chat is mounted outside the reader's tree,
 * so it provides them itself; off the reader there is no pane, it provides
 * none, and the browser keeps the click.
 */
export function useCitationReaderActions(onAtlas: (uuid: string) => void) {
  const [location] = useLocation();
  const { handleSplitChange } = useSplitPane(useAtlasNodeId());
  const onReader = location === ROUTES.ATLAS;
  return useMemo(
    () => (onReader ? { navigate: onAtlas, toggle: noop, splitNavigate: handleSplitChange } : null),
    [onReader, onAtlas, handleSplitChange],
  );
}
