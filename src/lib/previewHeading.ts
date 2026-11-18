// The heading line a preview redline opens on, and its diff. The line is the
// atlas heading without its `#` level, which is file-relative upstream and
// says nothing about the document: `A.1.2 - Title [Type] <!-- UUID: … -->`.
// A changed heading is diffed field by field, so only what changed is marked;
// isHeadingLine lets the reader's prose refinement (diffSentences.ts) leave
// that diff alone.

import { docNoChange } from "./docNoDiff";
import { mergeOps, wordDiff } from "./diffCore";
import type { DiffLine, WordSegment } from "./history";

/** The fields a patch is built from. */
export interface PatchDoc {
  id: string;
  doc_no: string;
  title?: string;
  type?: string;
  content?: string;
}

export function headingLine(doc: PatchDoc): string {
  const type = doc.type ? ` [${doc.type}]` : "";
  return `${doc.doc_no} - ${doc.title ?? ""}${type} <!-- UUID: ${doc.id} -->`;
}

/** A line headingLine wrote: it ends in the UUID comment. */
export const isHeadingLine = (line: string): boolean => /<!-- UUID: [0-9a-f-]+ -->\s*$/.test(line);

const drop = (segs: WordSegment[]) => segs.filter(([, t]) => t !== "");

/** A doc number as one changed run between the shared head and tail segments
 *  (docNoDiff.ts): `A.1.2.1 → A.1.1.2` reads as "2.1 became 1.2", never as
 *  scattered edits. A run empty on one side (a segment added or dropped)
 *  carries its own separator. */
function docNoField(a: string, b: string): WordSegment[] {
  if (a === b) return [["=", a]];
  const c = docNoChange(a, b);
  const join = (xs: string[]) => xs.join(".");
  if (c.prev.length && c.next.length) {
    const lead = c.head.length ? `${join(c.head)}.` : "";
    const trail = c.tail.length ? `.${join(c.tail)}` : "";
    return drop([["=", lead], ["-", join(c.prev)], ["+", join(c.next)], ["=", trail]]);
  }
  const run = (xs: string[]) => (!xs.length ? "" : c.head.length ? `.${join(xs)}` : `${join(xs)}.`);
  return drop([["=", join(c.head)], ["-", run(c.prev)], ["+", run(c.next)], ["=", c.head.length ? (c.tail.length ? `.${join(c.tail)}` : "") : join(c.tail)]]);
}

/** One other field: plain when unchanged; else a word diff (`words`) or the
 *  whole old value then the whole new one. */
function field(a: string, b: string, words: boolean): WordSegment[] {
  if (a === b) return drop([["=", a]]);
  return words ? wordDiff(a, b) : drop([["-", a], ["+", b]]);
}

/** A changed heading, field by field: the doc number as one run, the title by
 *  word, the type and UUID whole, the separators never. */
export function headingDiff(a: PatchDoc, b: PatchDoc): DiffLine {
  const type = (d: PatchDoc) => (d.type ? ` [${d.type}]` : "");
  return ["~", mergeOps([
    ...docNoField(a.doc_no, b.doc_no),
    ["=", " - "],
    ...field(a.title ?? "", b.title ?? "", true),
    ...field(type(a), type(b), false),
    ["=", " <!-- UUID: "],
    ...field(a.id, b.id, false),
    ["=", " -->"],
  ])];
}
