// A preview document's redline, built from the old side the bundle ships
// (before.json, removed.json) and the new side the reader already holds (the
// preview's own docs). Pure: the reader runs it for the one document it shows,
// and the server runs it for the chat and MCP preview tools, so both see the
// same lines.
//
// A patch is the WHOLE document on both sides, never trimmed to context or
// capped, and opens on the heading line (previewHeading.ts), so a renumbering,
// retitling or type change shows in the same box as the body.

import { lcsOps, pairAdjacentLines } from "./diffCore";
import type { DiffLine } from "./history";
import { headingDiff, headingLine, type PatchDoc } from "./previewHeading";

export { headingDiff, headingLine, isHeadingLine, type PatchDoc } from "./previewHeading";

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

/** "" is NO lines, not one empty line. */
function linesOf(text: string | undefined): string[] {
  return text ? text.split("\n") : [];
}

/** Line diff of two bodies. The lines they share at the start and the end stay
 *  out of the LCS table: an edit is local, and a long document would otherwise
 *  cost its length squared for every redline. */
function bodyDiff(a: string[], b: string[]): DiffLine[] {
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  const same = (xs: string[]) => xs.map((l): [string, string] => ["=", l]);
  const middle = lcsOps(a.slice(head, a.length - tail), b.slice(head, b.length - tail));
  return pairAdjacentLines([...same(a.slice(0, head)), ...middle, ...same(a.slice(a.length - tail))]);
}

/** Heading then body, the whole of both sides. A missing side is a new or a
 *  removed document. [] when the two sides are identical. */
export function docPatch(before: PatchDoc | undefined, after: PatchDoc | undefined): DiffLine[] {
  if (!before || !after) {
    const [sign, doc] = before ? (["-", before] as const) : (["+", after!] as const);
    return doc ? [headingLine(doc), ...linesOf(doc.content)].map((l): DiffLine => [sign, l]) : [];
  }
  const h = headingLine(before) === headingLine(after) ? (["=", headingLine(after)] as DiffLine) : headingDiff(before, after);
  const body = bodyDiff(linesOf(before.content), linesOf(after.content));
  return h[0] === "=" && body.every((l) => l[0] === "=") ? [] : [h, ...body];
}

/** The changed document `id` as it stood on the diff base, or undefined when
 *  before.json has no entry for it. */
export function beforeDoc(id: string, before: Record<string, BeforeEntry>, newSide: PatchDoc | undefined): PatchDoc | undefined {
  const b = before[id];
  return b ? { id, ...b, content: b.content ?? newSide?.content } : undefined;
}

/** Where a redline reads its inputs: the identity verdict (diff.json with
 *  identity.json laid over it), the old side, and the documents on both sides. */
export interface PatchSource {
  formerUuid: Record<string, { previousId: string }>;
  identitySwap: Record<string, { movedTo?: unknown }>;
  before: Record<string, BeforeEntry>;
  /** A document in the preview. */
  doc: (id: string) => PatchDoc | undefined;
  /** A document the preview removes. */
  removed: (id: string) => RemovedDoc | undefined;
}

/** One document's patch, by kind of change. Content that moved in from another
 *  UUID diffs against that UUID's old text; an identity swap whose old content
 *  was found elsewhere (the ⚠ case) shows only the new document; a changed
 *  document with no old side (a bundle built before before.json) shows none. */
export function previewPatch(id: string, kind: "added" | "changed" | "removed", s: PatchSource): DiffLine[] {
  if (kind === "removed") return docPatch(s.removed(id), undefined);
  if (kind === "added") {
    const prev = s.formerUuid[id]?.previousId;
    return docPatch(prev ? beforeDoc(prev, s.before, s.doc(prev)) : undefined, s.doc(id));
  }
  if (s.identitySwap[id]?.movedTo) return docPatch(undefined, s.doc(id));
  const old = beforeDoc(id, s.before, s.doc(id));
  return old ? docPatch(old, s.doc(id)) : [];
}
