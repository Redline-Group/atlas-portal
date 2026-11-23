import { track } from "../../lib/analytics";

export interface HiddenChildrenTabProps {
  nodeId: string;
  docNo: string;
  /** How many descendants sit behind the depth gate. */
  count: number;
  onReveal: (id: string) => void;
}

// The "N hidden" tab under a row whose deeper descendants are gated. The click
// stops at the tab so it does not also select or toggle the row.
export function HiddenChildrenTab({ nodeId, docNo, count, onReveal }: HiddenChildrenTabProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        track("reader_reveal_hidden", { node_id: nodeId, hidden_count: count });
        onReveal(nodeId);
      }}
      title={`View ${count} hidden ${count === 1 ? "section" : "sections"} under ${docNo}`}
      aria-label={`View ${count} hidden sections`}
      className="view-children-affordance"
    >
      <span>{count} hidden</span>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" aria-hidden="true">
        <path d="M0 0 L8 0 L4 5 Z" />
      </svg>
    </button>
  );
}
