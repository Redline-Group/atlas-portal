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
  /** Row is on its way out: still mounted so it can fade, but inert. It is
   *  unmounted for real once the reader's exit timer clears. */
  isExiting?: boolean;
  /** Primitives, never an object — passing an object here would break the
   *  memo above on every render. dir never changes without level also
   *  changing, so this adds zero extra re-renders in practice. */
  rungLevel?: RungLevel;
  rungDir?: RungDir;
  gatedCount?: number;
  onExpandChildren?: (id: string) => void;
  idPrefix?: string;
  /** Row is part of the selected node's descendant rail; "foot" closes it. */
  cradle?: "line" | "foot";
  cradleColor?: string;
  /** Owning prime/executor agent name — shown as a pill under the doc number
   *  whenever the row is expanded. Undefined for docs not under an agent. */
  agentName?: string | null;
  /** A flat filtered view (selected-only OR changed-only) is active: hides the
   *  hidden-descendants affordance, and swaps the pendulum's swing to the
   *  flatNextRung/flatReverseRung variant (rung 0 is invisible in these views —
   *  see AtlasReader's filterSet branch — so the ordinary 3-position swing
   *  would let the chevron rest at/lean toward "hidden" for a click that does
   *  nothing visible). Passed as a prop (not read from selection/preview
   *  context) so switching views doesn't re-render every row; see
   *  NodeSelectBox for the checkbox itself. */
  inSelectedOnly?: boolean;
}

export const CollapsibleNode = memo(function CollapsibleNode(props: CollapsibleNodeProps) {
  const { entry, isSelected, isExpanded, hasChildren = false, rungLevel = 0, rungDir = 1 } = props;
  const { gatedCount = 0, onExpandChildren, idPrefix, agentName, inSelectedOnly = false } = props;
  const { node, depth, hasContent } = entry;
  const { navigate, pendulum } = useAtlasActions();
  const isPreview = !!useDataSource().preview;
  const columns = useRowColumns(node, depth, hasChildren && !!pendulum);
  // In preview: faint when removed, slightly dimmed when untouched (unless selected).
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
      {/* In selected-only mode the reader shows a flat list that ignores depth-6
          gating, so revealing hidden descendants is a no-op — hide the tab
          rather than offer a dead button. */}
      {gatedCount > 0 && onExpandChildren && !inSelectedOnly && (
        <HiddenChildrenTab nodeId={node.id} docNo={node.doc_no} count={gatedCount} onReveal={onExpandChildren} />
      )}
      {isExpanded && <NodeBody entry={entry} agentName={agentName} columns={columns} onNavigate={navigate} />}
    </article>
  );
});
