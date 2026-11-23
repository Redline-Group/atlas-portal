import type { FlatEntry } from "@/lib/atlasHelpers";
import { NodeContent } from "../NodeContent";
import { bodyGutter, type RowColumns } from "./nodeRowLayout";

export interface NodeBodyProps {
  entry: FlatEntry;
  agentName?: string | null;
  columns: RowColumns;
  onNavigate: (id: string) => void;
}

export function NodeBody({ entry, agentName, columns, onNavigate }: NodeBodyProps) {
  if (!entry.hasContent && !agentName) return null;
  const gutter = bodyGutter(columns);
  return (
    <div className="flex items-start">
      {/* Reserves the full doc-number indent so the body's left edge is the same with or without a pill. */}
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
