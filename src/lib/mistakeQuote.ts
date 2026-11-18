// Is a stored finding's quote still in its document as the atlas reads now?
//
// The sweep only admits a finding whose quote is a literal substring of the
// document's title + body (validateFinding, scripts/lib/mistakes-sweep.mjs), so
// a quote that is no longer there means the passage was rewritten upstream —
// usually because the defect was fixed. Matching is looser than the sweep's in
// three ways that only absorb how older rows were quoted, never a real edit:
// whitespace runs compare equal (list items and paragraphs quoted on one
// line), an elided quote ("a ... b", "a [...] b") needs every fragment, and a
// quoted heading line ("###### A.1.2 - Title [Core] <!-- UUID: … -->", maybe
// running on into the body) matches the heading the doc has under either its
// sweep-time or its current doc_no.
import type { AtlasNode } from "../types";

const ELISION = /\[\.\.\.\]|\.\.\.|…/;
const squash = (s: string): string => s.replace(/\s+/g, " ").trim();

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
    .map((p) => squash(p.replace(/^\s*#+\s*/, "")))
    .filter(Boolean);
  return parts.every((p) => hay.includes(p));
}
