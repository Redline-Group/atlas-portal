// The Agent Artifact a candidate's document sits in and the Executor Agent
// accountable for it (src/lib/mistakeOwnership.ts). Nothing for a document
// outside every agent artifact — its doc_no already names the scope.
import type { MistakeRow } from "@/lib/potentialMistakesIndex";

export function MistakeOwnerNote({ r }: { r: MistakeRow }) {
  if (!r.agent) return null;
  return (
    <span className="mono text-[10px] text-tan-3 block mt-0.5">
      {r.agent}
      {r.viaExecutor && ` · executor ${r.executorLabel}`}
    </span>
  );
}
