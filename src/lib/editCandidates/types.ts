// One source of Edit Candidates rows. The text sweep, Stale Dates and the PAU
// audit each describe themselves with this; the browser-side registry
// (apps/web/src/lib/editCandidates/) adds each one's loader.
export interface CandidateSourceMeta {
  /** Row key, the Source pill's URL value and the CSV's Source column key. */
  id: string;
  label: string;
  /** One sentence on what the source checks and how current it is. */
  hint: string;
  /** In-app path of the report holding the source's full detail, or "". */
  detailPath: string;
}
