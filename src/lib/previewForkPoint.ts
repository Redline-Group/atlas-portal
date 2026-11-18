// Where a preview's branch left the base it is compared to: the merge-base
// commit of the active diff base. One reading for the banner
// (apps/web previewMetaCopy.ts) and the chat/MCP preview tools (tools-preview-get.ts).

interface ForkCandidate {
  repo: string;
  ref: string;
  mergeBase: string;
  mergeBaseDate?: string;
}

/** The bases meta.json records, as far as a fork point needs them. */
export interface ForkBases {
  auto?: string;
  sky?: ForkCandidate;
  repo?: ForkCandidate;
}

export interface ForkPoint {
  repo: string;
  ref: string;
  /** The merge-base commit, short. */
  sha: string;
  /** Its committer date (ISO 8601), when recorded. */
  date?: string;
}

/** The fork point of base `key` (defaulting to the auto base). Null for the
 *  live-main fallback, which compares to main as it is now, and for a bundle
 *  that recorded no merge base. */
export function forkPointOf(bases: ForkBases | undefined, key?: string | null): ForkPoint | null {
  const k = key ?? bases?.auto ?? null;
  const cand = k === "sky" || k === "repo" ? bases?.[k] : undefined;
  return cand?.mergeBase ? { repo: cand.repo, ref: cand.ref, sha: cand.mergeBase.slice(0, 7), date: cand.mergeBaseDate } : null;
}
