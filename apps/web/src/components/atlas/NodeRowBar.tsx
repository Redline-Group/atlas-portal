import type { FlatEntry } from "@/lib/atlasHelpers";
import { PreviewMark } from "../preview/PreviewMark";
import { NodeDocNo } from "./NodeDocNo";
import { PendulumChevron } from "./PendulumChevron";
import type { RowColumns } from "./nodeRowLayout";
import type { Rung } from "./subtreeState";

const TITLE_CLASS = "text-lg font-bold";

// The shift-click hint sits on the title only; on the whole row it showed near-constantly.
function NodeTitle({ depth, heading, inSplit }: { depth: number; heading: string; inSplit: boolean }) {
  const HeadingTag = `h${Math.min(depth, 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <div
      data-mod-hint={inSplit ? "split-main" : "split"}
      className="atlas-node-title flex items-center gap-2 py-1.5 flex-1 min-w-0"
    >
      <HeadingTag className={TITLE_CLASS}>{heading}</HeadingTag>
    </div>
  );
}

export interface NodeRowBarProps {
  entry: FlatEntry;
  columns: RowColumns;
  rung: Rung;
  flat: boolean;
  inSplit: boolean;
  isPreview: boolean;
}

// data-row-bar lets clickRow (useRowActivation.ts) tell title-bar clicks from body clicks.
export function NodeRowBar({ entry, columns, rung, flat, inSplit, isPreview }: NodeRowBarProps) {
  const { node, depth } = entry;
  return (
    <div data-row-bar className="flex items-center gap-2 pl-3">
      <NodeDocNo node={node} columns={columns} />
      {columns.chevron === "pendulum" && <PendulumChevron nodeId={node.id} docNo={node.doc_no} rung={rung} flat={flat} />}
      {columns.chevron === "spacer" && (
        <span className="atlas-node-toggle" style={{ visibility: "hidden" }} aria-hidden="true">
          {"»"}
        </span>
      )}
      {isPreview && <PreviewMark nodeId={node.id} className="text-lg" />}
      <NodeTitle depth={depth} heading={node.title} inSplit={inSplit} />
    </div>
  );
}
