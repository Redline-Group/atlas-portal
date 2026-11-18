// Is a stored finding's quote still in its document as the atlas reads now?
//
// The sweep only admits a finding whose quote is a literal substring of the
// document's title + body (validateFinding, scripts/lib/mistakes-sweep.mjs), so
// a quote absent from the served doc means its passage differs from the swept
// text — usually because the defect was fixed. Matching is looser than the sweep's in
// ways that only absorb how older rows were quoted or typographic upstream
// edits, never a change of wording: whitespace runs compare equal (list items
// and paragraphs quoted on one line), curly and straight quotes compare equal
// and a fragment's trailing punctuation is ignored (an upstream pass that
// turns "Keel's." into "Keel’s" fixes nothing), an elided quote ("a ... b",
// "a [...] b") needs every fragment, and a quoted heading line
// ("###### A.1.2 - Title [Core] <!-- UUID: … -->", maybe running on into the
// body) matches the heading the doc has under either its sweep-time or its
// current doc_no.
import type { AtlasNode } from "../types";

const ELISION = /\[\.\.\.\]|\.\.\.|…/;
const squash = (s: string): string =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();

/** The doc as markdown, once per heading form (current and sweep-time doc_no). */
function documentText(doc: AtlasNode, sweepDocNo: string): string {
  const heading = (n: string) => `${n} - ${doc.title} [${doc.type}]\n${doc.content}`;
  return squash(`${doc.title}\n${heading(doc.doc_no)}\n${heading(sweepDocNo)}`);
}

export function quoteInDoc(quote: string, sweepDocNo: string, doc: AtlasNode): boolean {
  const hay = documentText(doc, sweepDocNo);
  const parts = quote
    .replace(/<!--[\s\S]*?-->/g, " ")
    .split(ELISION)
    .map((p) => squash(p.replace(/^\s*#+\s*/, "")).replace(/[.,;:]+$/, ""))
    .filter(Boolean);
  return parts.every((p) => hay.includes(p));
}
