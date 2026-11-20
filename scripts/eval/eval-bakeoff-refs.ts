// Reference-format compliance metrics for the chat bakeoff (eval-bakeoff.ts).
import { citationValues, extractCitations } from "../../src/server/chat/verify/verify-checks.ts";
import type { ReferenceExpansion } from "../../src/server/chat/verify/citation-normalize.ts";

// Reference-style compliance (docs/plans/reference-citations.md). Prompt-behaviour
// measurement, not grading: only `undefinedLabels` and `shippedBrackets` are
// defects — `unusedLabels` and a bottom-placed block are accepted degradations,
// and an inline-only answer is fully supported.
export interface RefStats {
  usedRefStyle: boolean;   // emitted a definition block at all
  blockFirst: boolean;     // …and it opened the answer (the streaming win)
  // Reference uses that stream BEFORE the block finishes — the metric that
  // actually matters for the reader: until a label's definition arrives, remark
  // renders its use as literal `[text][label]` brackets. Strictly better than
  // blockFirst, which counts a block sitting under a one-line intro (harmless,
  // no use precedes it) the same as a block at the very bottom (5 uses of
  // visible bracket junk for the whole stream — both measured on gemma).
  usesBeforeBlock: number;
  definitions: number;
  undefinedLabels: number; // used but undeclared AND unresolvable — hard failure
  unusedLabels: number;
  multiLabel: number;      // `[text][a, b]` — invalid CommonMark, normalizer splits it
  shippedBrackets: number; // reference syntax surviving into the shipped answer (bug)
  valueCitations: number;  // citations whose link text IS a value (the directive)
}

export const EMPTY_REFS: RefStats = { usedRefStyle: false, blockFirst: false, usesBeforeBlock: 0, definitions: 0, undefinedLabels: 0, unusedLabels: 0, multiLabel: 0, shippedBrackets: 0, valueCitations: 0 };

// Reference-syntax shapes are measured on the RAW answer — normalization erases
// the definition block and rewrites every use — except the two that must be
// counted after it: labels it could not resolve, and reference syntax that
// somehow survived into the shipped text.
// Restricted to /atlas/ destinations, matching definition-block-gate.ts's `DEF`
// — this measures compliance with the citation contract, so an unrelated
// CommonMark ref-def to some other URL is not part of the block.
const DEF_LINE_RE = /^ {0,3}\[[^[\]\n]{1,120}\]:\s*<?\/atlas\//;
const MULTI_LABEL_RE = /\[[^[\]\n]{1,120}\]\[[^[\]\n]*,[^[\]\n]*\]/g;
const REF_USE_RE = /\[[^[\]\n]{1,120}\]\[[^[\]\n]{0,200}\]/g;

export function refStats(raw: string, refs: ReferenceExpansion, shipped: string): RefStats {
  const lines = raw.split("\n");
  const firstLine = lines.find((l) => l.trim() !== "") ?? "";
  const lastDef = lines.reduce((last, l, i) => (DEF_LINE_RE.test(l) ? i : last), -1);
  return {
    usedRefStyle: refs.definitions.size > 0,
    blockFirst: DEF_LINE_RE.test(firstLine),
    usesBeforeBlock: lines
      .slice(0, Math.max(0, lastDef))
      .filter((l) => !DEF_LINE_RE.test(l))
      .reduce((n, l) => n + (l.match(REF_USE_RE) ?? []).length, 0),
    definitions: refs.definitions.size,
    undefinedLabels: refs.undefinedLabels.length,
    unusedLabels: refs.unusedLabels.length,
    multiLabel: (raw.match(MULTI_LABEL_RE) ?? []).length,
    shippedBrackets: (shipped.match(REF_USE_RE) ?? []).length,
    valueCitations: extractCitations(shipped).filter((c) => citationValues(c.title).length > 0).length,
  };
}
