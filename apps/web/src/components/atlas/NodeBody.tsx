import type { FlatEntry } from "@/lib/atlasHelpers";
import { NodeContent } from "../NodeContent";
import { bodyGutter, type RowColumns } from "./nodeRowLayout";

export interface NodeBodyProps {
  entry: FlatEntry;
  /** Owning prime/executor agent name — shown as a pill under the doc number.
   *  Undefined for docs not under an agent. */
  agentName?: string | null;
  columns: RowColumns;
  onNavigate: (id: string) => void;
}

// An expanded row's body: the doc text, indented to start where the title
// text does. A row with neither text nor an agent pill has no body.
export function NodeBody({ entry, agentName, columns, onNavigate }: NodeBodyProps) {
  if (!entry.hasContent && !agentName) return null;
  const gutter = bodyGutter(columns);
  return (
    <div className="flex items-start">
      {/* Left gutter: the owning-agent pill, aligned under the doc-number
          chiclets and never wider than them — a long name wraps to further
          (centered) lines within that width. The column reserves the full
          doc-number indent so the body keeps the exact left edge it had with
          no pill. */}
      <div className="shrink-0 pl-3" style={{ width: gutter.width, marginTop: 4.5 }}>
        {agentName && (
          <span className="atlas-agent-pill" style={{ maxWidth: gutter.pillMaxWidth }}>
            {agentName}
          </span>
        )}
      </div>
      {entry.hasContent && (
        <div className="atlas-node-body flex-1 min-w-0" style={{ marginLeft: 0 }}>
          <NodeContent content={entry.node.content} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}
