import type { CandidateSourceMeta } from "@/lib/editCandidates/types";
import type { Mistake } from "@/lib/potentialMistakesIndex";
import type { AtlasNode } from "@/types";

export interface SourceContext {
  /** The atlas being served. */
  docs: Record<string, AtlasNode>;
  /** The current UTC day, YYYY-MM-DD. */
  today: string;
}

/** A source of Edit Candidates rows: what it is, and how the browser loads it. */
export interface CandidateSource extends CandidateSourceMeta {
  /** The source's candidates; rejects when the source is unavailable. */
  load(ctx: SourceContext): Promise<Mistake[]>;
}
