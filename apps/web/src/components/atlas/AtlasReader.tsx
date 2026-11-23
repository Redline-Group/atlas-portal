import { memo, useRef, type CSSProperties } from "react";
import { AtlasActionsContext, useAtlasActions } from "./AtlasActionsContext";
import { useAtlasScroll } from "./useAtlasScroll";
import { JuniorPane } from "./JuniorPane";
import { SplitOpenButton } from "./SplitOpenButton";
import { useShowInMain } from "./useShowInMain";
import { useReaderActions } from "./useReaderActions";
import { useReaderDisclosure } from "./useReaderDisclosure";
import { useReaderRows } from "./useReaderRows";
import { useAtlasFilter } from "../../lib/atlasFilter";
import { ErrorBoundary, PanelError } from "../ErrorBoundary";
import type { SplitChange, SplitOpenVia } from "../../hooks/useSplitPane";
import type { LoadedData } from "@/lib/atlasHelpers";

export { EXIT_MS } from "./useExitingRows";

const ATLAS_LEFT_PANE_STYLE: CSSProperties = {
  borderRight: "1px solid var(--border)",
  minHeight: 0,
};
const SCROLLER_STYLE: CSSProperties = { minHeight: 0 };

const panelError = (error: Error) => <PanelError error={error} />;

export interface AtlasReaderProps {
  id: string;
  selectedId: string | null;
  splitId: string | null;
  onSplitChange: SplitChange;
  data: LoadedData;
  agentByDoc?: Map<string, string> | null;
}

interface ReaderSplitPaneProps {
  splitId: string;
  data: LoadedData;
  onSplitChange: SplitChange;
  onShowInMain: (id: string, via?: SplitOpenVia) => void;
}

function ReaderSplitPane({ splitId, data, onSplitChange, onShowInMain }: ReaderSplitPaneProps) {
  return (
    <ErrorBoundary resetKey={splitId} fallback={panelError}>
      <JuniorPane
        splitId={splitId}
        data={data}
        onReroot={onSplitChange}
        onShowInMain={onShowInMain}
        onClose={() => onSplitChange(null)}
      />
    </ErrorBoundary>
  );
}

// memo: AtlasView re-renders on panel state the reader ignores; all props are stable refs.
export const AtlasReader = memo(function AtlasReader(props: AtlasReaderProps) {
  const { id, selectedId, splitId, onSplitChange, data, agentByDoc } = props;
  const { navigate } = useAtlasActions();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const filter = useAtlasFilter();
  const flat = !!filter.filterSet;
  const disclosure = useReaderDisclosure({ id, selectedId, data, flat, scrollContainerRef });
  // Re-scroll on view-mode flips so leaving a filtered view keeps the node in view.
  useAtlasScroll(id, data, disclosure.rung, filter.subset);
  const docList = useReaderRows({ flatNodes: data.flatNodes, selectedId, agentByDoc }, filter, disclosure);
  const showInMain = useShowInMain(navigate);
  const actions = useReaderActions(data, disclosure.bodies.toggle, disclosure.pendulum);

  return (
    <AtlasActionsContext.Provider value={actions}>
      <div className="relative flex flex-col overflow-hidden flex-1 min-w-0" style={ATLAS_LEFT_PANE_STYLE}>
        {id && !splitId && <SplitOpenButton onClick={() => onSplitChange(id)} />}
        <div ref={scrollContainerRef} className="atlas-scroll overflow-y-auto flex-1" style={SCROLLER_STYLE}>
          <div className="mx-auto py-2">
            <ErrorBoundary resetKey={id} fallback={panelError}>
              {docList}
            </ErrorBoundary>
          </div>
        </div>
        {splitId && (
          <ReaderSplitPane splitId={splitId} data={data} onSplitChange={onSplitChange} onShowInMain={showInMain} />
        )}
      </div>
    </AtlasActionsContext.Provider>
  );
});
