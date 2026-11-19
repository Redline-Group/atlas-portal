import type { ReportMeta } from "./types";

export const editCandidates = {
  id: "edit-candidates",
  title: "Edit Candidates",
  description:
    "Everything in the Atlas that may need an update, in one list: typos and grammar slips, broken cross-references, wrong figures, internal contradictions, dates the text still phrases as upcoming after they passed, and values where the Atlas and the chain disagree — each quoted and linked to its document. Not an atlas concept: an AI sweep the Redline Portal re-runs as documents change, plus its own date and Atlas-versus-chain checks. Each row is a candidate to check, not a confirmed error.",
  group: "health",
  sources: ["onchain", "external", "derived", "ai"],
  scope: { label: "edits", placeholder: "Filter candidates — doc no, title, quoted text, issue" },
} as const satisfies ReportMeta;
