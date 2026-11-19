// The PAU audit as an Edit Candidates source: every audit row that cites an
// Atlas document, since only a row with a document names something to edit.
import { reportPath } from "../reports/registry";
import type { AuditGroup } from "../pauAudit";
import type { AuditRow } from "../pauAuditIndex";
import type { Mistake, MistakeSeverity } from "../potentialMistakesIndex";
import type { AtlasNode } from "../../types";
import type { CandidateSourceMeta } from "./types";

export const PAU_SOURCE: CandidateSourceMeta = {
  id: "pau-audit",
  label: "Atlas vs chain",
  hint: "Prime Agent PAU values, controllers and role claims where the Atlas and the chain disagree or cannot be compared, read from the chain by the atlas worker.",
  detailPath: reportPath("pau-audit"),
};

// How likely the Atlas text is the side to change: the audit's own grouping.
const CONFIDENCE: Record<AuditGroup, MistakeSeverity> = {
  atlas: "high",
  registry: "medium",
  "spell-executed": "medium",
  detail: "medium",
  ambiguous: "low",
  spell: "low",
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The later of the two dated moves, when either is a plain date. */
function lastMove(r: AuditRow): string | undefined {
  const dated = [r.chainSetAt, r.atlasChangedAt].filter((d): d is string => !!d && ISO_DAY.test(d));
  return dated.sort().at(-1);
}

/** One candidate per audit row whose document is in `docs`. */
export function pauCandidates(rows: readonly AuditRow[], docs: Record<string, AtlasNode>): Mistake[] {
  return rows.flatMap((r, i): Mistake[] => {
    const doc = r.docId ? docs[r.docId] : undefined;
    if (!doc) return [];
    const where = [r.prime, r.chain, r.subject].filter(Boolean).join(" · ");
    return [{
      id: `pau:${r.item}:${i}`,
      docNo: doc.doc_no,
      uuid: doc.id,
      file: "",
      category: "onchain",
      severity: CONFIDENCE[r.group],
      pass: "deterministic",
      quote: `${r.label}: ${r.stated}`,
      issue: `${where} — ${r.note}${r.onchain ? ` On chain: ${r.onchain}.` : ""}`,
      fix: null,
      firstSeen: lastMove(r),
    }];
  });
}
