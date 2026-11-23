import { memo } from "react";
import { type FlatEntry } from "@/lib/atlasHelpers";
import { NodeMeta } from "./NodeMeta";
import { useAtlasActions } from "./AtlasActionsContext";
import { usePreviewFade } from "../../lib/previewFilter";
import { useDataSource } from "../../lib/dataSource";
import { NodeSelectBox } from "./NodeSelectBox";
import { NodeRowBar } from "./NodeRowBar";
import { NodeBody } from "./NodeBody";
import { HiddenChildrenTab } from "./HiddenChildrenTab";
import { useRowActivation } from "./useRowActivation";
import { nodeRowAttrs } from "./nodeRowAttrs";
import { useRowColumns } from "./nodeRowLayout";
import type { RungDir, RungLevel } from "./subtreeState";

export interface CollapsibleNodeProps {
  entry: FlatEntry;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren?: boolean;
  isExiting?: boolean;
  /** Primitives, not a Rung object, so the memo holds. */
  rungLevel?: RungLevel;
  rungDir?: RungDir;
  gatedCount?: number;
  onExpandChildren?: (id: string) => void;
  idPrefix?: string;
  cradle?: "line" | "foot";
  cradleColor?: string;
  agentName?: string | null;
  /** A flat filtered view is active. A prop, not context, so switching views doesn't re-render every row. */
  inSelectedOnly?: boolean;
}

export const CollapsibleNode = memo(function CollapsibleNode(props: CollapsibleNodeProps) {
  const { entry, isSelected, isExpanded, hasChildren = false, rungLevel = 0, rungDir = 1 } = props;
  const { gatedCount = 0, onExpandChildren, idPrefix, agentName, inSelectedOnly = false } = props;
  const { node, depth, hasContent } = entry;
  const { navigate, pendulum } = useAtlasActions();
  const isPreview = !!useDataSource().preview;
  const columns = useRowColumns(node, depth, hasChildren && !!pendulum);
  const fade = usePreviewFade(node.id, 0.92, isSelected);
  const activation = useRowActivation({ nodeId: node.id, isSelected, isExpanded, hasContent });
  return (
    <article
      {...nodeRowAttrs(props, fade)}
      aria-label={`${node.doc_no} — ${node.title}`}
      aria-expanded={hasContent ? isExpanded : undefined}
      tabIndex={0}
      {...activation}
    >
      {!isPreview && <NodeSelectBox nodeId={node.id} title={node.title} />}
      <NodeRowBar
        entry={entry}
        columns={columns}
        rung={{ level: rungLevel, dir: rungDir }}
        flat={inSelectedOnly}
        inSplit={idPrefix === "junior"}
        isPreview={isPreview}
      />
      {isSelected && isExpanded && <div className="atlas-node-meta"><NodeMeta node={node} /></div>}
      {/* The flat view ignores depth gating, so the tab would be a dead button. */}
      {gatedCount > 0 && onExpandChildren && !inSelectedOnly && (
        <HiddenChildrenTab nodeId={node.id} docNo={node.doc_no} count={gatedCount} onReveal={onExpandChildren} />
      )}
      {isExpanded && <NodeBody entry={entry} agentName={agentName} columns={columns} onNavigate={navigate} />}
    </article>
  );
});
