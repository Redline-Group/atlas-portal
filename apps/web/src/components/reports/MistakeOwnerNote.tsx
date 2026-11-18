// The Agent Artifact a finding's document sits in and the Executor Agent
// accountable for it (src/lib/mistakeOwnership.ts). Nothing for a document
// outside every agent artifact — its doc_no already names the scope.
import { NO_EXECUTOR } from "@/lib/mistakeOwnership";
import type { MistakeRow } from "@/lib/potentialMistakesIndex";

export function MistakeOwnerNote({ r }: { r: MistakeRow }) {
  if (!r.agent) return null;
  const viaExecutor = r.executorLabel && r.executorLabel !== r.agent && r.executor !== NO_EXECUTOR;
  return (
    <span className="mono text-[10px] text-tan-3 block mt-0.5">
      {r.agent}
      {viaExecutor && ` · executor ${r.executorLabel}`}
    </span>
  );
}
