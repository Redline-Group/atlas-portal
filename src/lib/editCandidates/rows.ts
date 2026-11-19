// Joins every source's candidates into the one list the report shows.
import type { AtlasNode } from "../../types";
import { NO_OWNER, type Ownership } from "../mistakeOwnership";
import { SWEEP_SOURCE, resolveFindings, sortMistakes, type Mistake, type MistakeRow } from "../potentialMistakesIndex";
import type { CandidateSourceMeta } from "./types";

export interface SourceBatch {
  meta: CandidateSourceMeta;
  findings: readonly Mistake[];
}

/**
 * Every batch joined to the served atlas, stamped with its source and each
 * document's last-change date, in report order. Only the text sweep's rows are
 * held to their quote: a derived source is computed from the served atlas, and
 * what it puts in `quote` is a snippet, so it never reads as fixed upstream.
 */
export function joinCandidates(
  batches: readonly SourceBatch[],
  docs: Record<string, AtlasNode>,
  owner: (uuid: string) => Ownership = () => NO_OWNER,
  docChanged: ReadonlyMap<string, string> | null = null,
): MistakeRow[] {
  const rows = batches.flatMap(({ meta, findings }) => {
    const stored = meta.id === SWEEP_SOURCE.source;
    return resolveFindings(findings, docs, owner).map((r): MistakeRow => ({
      ...r,
      status: !stored && r.status === "fixed" ? "current" : r.status,
      source: meta.id,
      sourceLabel: meta.label,
      detailHref: meta.detailPath,
      docChanged: (r.uuid && docChanged?.get(r.uuid)) || "",
    }));
  });
  return sortMistakes(rows);
}
