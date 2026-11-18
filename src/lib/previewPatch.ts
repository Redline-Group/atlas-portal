// A preview document's redline, built from the old side the bundle ships
// (before.json, removed.json) and the new side the reader already holds (the
// preview's own docs). Pure: the reader runs it for the one document it shows,
// and the server runs it for the chat and MCP preview tools, so both see the
// same lines.
//
// A patch is the WHOLE document on both sides, never trimmed to context or
// capped, and opens on the heading line (doc number, title, type, UUID), so a
// renumbering, retitling or type change shows in the same box as the body.

import { lcsOps, pairAdjacentLines } from "./diffCore";
import type { DiffLine } from "./history";

/** The fields a patch is built from. */
export interface PatchDoc {
  id: string;
  doc_no: string;
  title?: string;
  type?: string;
  content?: string;
}

/** before.json entry: a changed document as it stood on the diff base. `content`
 *  is left out when the body did not change, so it reads from the new side. */
export interface BeforeEntry {
  doc_no: string;
  title?: string;
  type?: string;
  content?: string;
}

/** removed.json entry: a document on the diff base that the preview dropped,
 *  with where it stood. `after` is the sibling it followed (removed or kept
 *  under the same parent), null when it came first. */
export interface RemovedDoc extends PatchDoc {
  parentId: string | null;
  after: string | null;
  depth: number;
}

/** The atlas heading without its `#` level, which is file-relative upstream and
 *  says nothing about the document: `A.1.2 - Title [Type] <!-- UUID: … -->`. */
export function headingLine(doc: PatchDoc): string {
  const type = doc.type ? ` [${doc.type}]` : "";
  return `${doc.doc_no} - ${doc.title ?? ""}${type} <!-- UUID: ${doc.id} -->`;
}

/** "" is NO lines, not one empty line. */
function linesOf(text: string | undefined): string[] {
  return text ? text.split("\n") : [];
}

const sideOf = (doc: PatchDoc | undefined) => (doc ? [headingLine(doc), ...linesOf(doc.content)] : []);

/** Heading then body, the whole of both sides. A missing side is a new or a
 *  removed document. [] when the two sides are identical. */
export function docPatch(before: PatchDoc | undefined, after: PatchDoc | undefined): DiffLine[] {
  const prev = sideOf(before);
  const curr = sideOf(after);
  if (prev.length === curr.length && prev.every((l, i) => l === curr[i])) return [];
  return pairAdjacentLines(lcsOps(prev, curr));
}

/** The changed document `id` as it stood on the diff base, or undefined when
 *  before.json has no entry for it. */
export function beforeDoc(id: string, before: Record<string, BeforeEntry>, newSide: PatchDoc | undefined): PatchDoc | undefined {
  const b = before[id];
  return b ? { id, ...b, content: b.content ?? newSide?.content } : undefined;
}

/** What the reader and the tools need to know about one document's change. */
export interface PatchInput {
  id: string;
  kind: "added" | "changed" | "removed";
  /** The document in the preview; undefined for a removed one. */
  doc?: PatchDoc;
  before: Record<string, BeforeEntry>;
  removed?: RemovedDoc;
  /** formerUuid[id].previousId: the UUID this added document's content came from. */
  previousId?: string;
  /** The previous UUID's document in the preview, for its unchanged body. */
  previousDoc?: PatchDoc;
  /** An identity swap whose old content was found under a new UUID (the ⚠ case). */
  corroboratedSwap?: boolean;
}

/** One document's patch, by kind of change. */
export function previewPatch(p: PatchInput): DiffLine[] {
  if (p.kind === "removed") return docPatch(p.removed, undefined);
  if (p.kind === "added") {
    const from = p.previousId ? beforeDoc(p.previousId, p.before, p.previousDoc) : undefined;
    return docPatch(from, p.doc);
  }
  if (p.corroboratedSwap) return docPatch(undefined, p.doc);
  // No old side (a bundle built before before.json existed): no redline, never a false all-added one.
  const old = beforeDoc(p.id, p.before, p.doc);
  return old ? docPatch(old, p.doc) : [];
}
