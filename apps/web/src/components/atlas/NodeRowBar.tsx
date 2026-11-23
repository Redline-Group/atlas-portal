import type { FlatEntry } from "@/lib/atlasHelpers";
import { PreviewMark } from "../preview/PreviewMark";
import { NodeDocNo } from "./NodeDocNo";
import { PendulumChevron } from "./PendulumChevron";
import type { RowColumns } from "./nodeRowLayout";
import type { Rung } from "./subtreeState";

const TITLE_CLASS = "text-lg font-bold";

// Shift-click works anywhere on the row, but marking the whole row put the
// hint up while crossing the chiclets, the pendulum chevron and the body text
// as well — near-constantly. The title is where the gesture is worth offering.
//
// Inside the split pane a shift-click highlights the doc in the main reader
// instead, so the hint says that — as does the CSS hint for these rows
// (--split-hint on .junior-pane, index.css).
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
  /** Where this row's children sit on the pendulum. */
  rung: Rung;
  /** A flat filtered view is active (see PendulumChevron). */
  flat: boolean;
  /** The row sits in the split pane. */
  inSplit: boolean;
  isPreview: boolean;
}

// A reader row's title bar: doc number, pendulum chevron, title.
// data-row-bar: the marker the row's click handler uses to tell title-bar
// clicks from body clicks (see clickRow in useRowActivation.ts).
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
