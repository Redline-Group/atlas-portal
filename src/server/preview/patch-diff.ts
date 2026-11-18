// Preview diff rendering on top of the shared diff core (src/lib/diffCore.ts —
// the same LCS / word-diff / pairing the live history pipeline uses), producing
// the DiffLine[] shape <DiffView> renders.
//
// A preview patch is the WHOLE document on both sides: every unchanged line is
// kept, nothing is trimmed to context and nothing is capped, so a reader sees
// the entire old and entire new document. The first line is the document's
// heading (doc number, title, type, UUID), so a renumbering, retitling or type
// change shows inside the same box as the body. Readers that need a bound (the
// chat and MCP preview tools) cap it themselves with renderPatch (bundle-read.ts).

import type { DiffLine } from "../../lib/history";
import { lcsOps, pairAdjacentLines } from "../../lib/diffCore";

/** The fields of a document its patch is built from. */
export interface PatchDoc {
  id: string;
  doc_no: string;
  title?: string;
  type?: string;
  content?: string;
}

/** The atlas heading without its `#` level, which is file-relative upstream and
 *  says nothing about the document: `A.1.2 - Title [Type] <!-- UUID: … -->`. */
export function headingLine(doc: PatchDoc): string {
  const type = doc.type ? ` [${doc.type}]` : "";
  return `${doc.doc_no} - ${doc.title ?? ""}${type} <!-- UUID: ${doc.id} -->`;
}

/** "" is NO lines, not one empty line: split would yield [""] and emit a
 *  spurious ["-",""] when diffing against a brand-new document. */
function linesOf(text: string): string[] {
  return text === "" ? [] : text.split("\n");
}

/** Full diff of two texts: every line, changed or not. [] when they are equal. */
export function contentDiff(prev: string, curr: string): DiffLine[] {
  if (prev === curr) return [];
  return pairAdjacentLines(lcsOps(linesOf(prev), linesOf(curr)));
}

/** One document's patch: heading line, then body, the whole of both sides.
 *  `before` absent means the document is new, so every line is an addition.
 *  [] when heading and body are both unchanged. */
export function docPatch(before: PatchDoc | undefined, after: PatchDoc): DiffLine[] {
  const prev = before ? [headingLine(before), ...linesOf(before.content ?? "")] : [];
  const curr = [headingLine(after), ...linesOf(after.content ?? "")];
  if (prev.length === curr.length && prev.every((l, i) => l === curr[i])) return [];
  return pairAdjacentLines(lcsOps(prev, curr));
}
