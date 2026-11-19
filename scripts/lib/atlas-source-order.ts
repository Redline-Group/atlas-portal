/**
 * Document ordering for consolidated Atlas bucket files. Part of the
 * atlas-source module: only atlas-source.mjs imports it. Port of upstream's
 * sync/partition.py (split_into_blocks / canonical_sort_key / order_documents).
 */

import { HEADING_RE } from "./atlas-parser.mjs";
import { AtlasSourceError } from "./atlas-source-error.ts";

const isNr = (docNo: string) => docNo.startsWith("NR-");

/** Cut one file's lines into blocks at numbered-document headings. A Needed
 *  Research doc has no position of its own (flat `NR-<n>` namespace; its target
 *  is "the numbered document it follows"), so it travels inside the preceding
 *  block and is never sorted as a document. Mirror of split_into_blocks. */
export function splitIntoBlocks(source: string, lines: string[]) {
  const heads: [number, string][] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_RE.exec(lines[i]);
    if (m) heads.push([i, m[2]]);
  }
  if (!heads.length) throw new AtlasSourceError(`${source} contains no Atlas document headings`);
  if (heads[0][0] !== 0)
    throw new AtlasSourceError(
      `${source} has ${heads[0][0]} line(s) before its first document heading — that text belongs to no document and would be dropped at reassembly`,
    );
  if (isNr(heads[0][1]))
    throw new AtlasSourceError(`${source} begins with Needed Research ${heads[0][1]}, which has no numbered document in this file to travel with`);
  const starts = heads.filter(([, dn]) => !isNr(dn));
  return starts.map(([start, docNo], k) => ({
    docNo,
    source,
    index: k,
    lines: lines.slice(start, k + 1 < starts.length ? starts[k + 1][0] : lines.length),
  }));
}

/** Compose's emit position for a numbered document, from its doc number alone.
 *  Per segment: (rank, value, text) with rank 0 = real child (some document
 *  claims the prefix), 1 = phantom extension folder (`0` segments no document
 *  claims — compose emits a parent's real children BEFORE any phantom-rooted
 *  subtree, which naive numeric order gets backwards in ~410 places), 2 = the
 *  non-integer `var1` Scenario Variation segment. A parent's key is a prefix of
 *  its children's, so it sorts first for free. Mirror of canonical_sort_key. */
export function canonicalSortKey(docNo: string, realDocNos: Set<string>) {
  const parts = docNo.split(".");
  const key: [number, number, string][] = [];
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i];
    if (/^\d+$/.test(seg)) key.push([realDocNos.has(parts.slice(0, i + 1).join(".")) ? 0 : 1, Number.parseInt(seg, 10), ""]);
    else key.push([2, 0, seg]);
  }
  return key;
}

function compareKeys(a: [number, number, string][], b: [number, number, string][]) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 3; j++) {
      const x = a[i][j];
      const y = b[i][j];
      if (x !== y) return x < y ? -1 : 1;
    }
  }
  return a.length - b.length; // a shorter tuple (the parent) compares less
}

/** Merge split files into the composed line stream, ordered by document. Depends
 *  on neither file order, names, count, nor any manifest. Mirror of order_documents. */
export function orderDocuments(linesBySource: Map<string, string[]>) {
  const blocks: { docNo: string; source: string; index: number; lines: string[] }[] = [];
  for (const source of [...linesBySource.keys()].sort()) blocks.push(...splitIntoBlocks(source, linesBySource.get(source)!));
  const origin = new Map<string, string>();
  for (const b of blocks) {
    if (origin.has(b.docNo))
      throw new AtlasSourceError(`document ${b.docNo} appears in both ${origin.get(b.docNo)} and ${b.source} — a document must live in exactly one file`);
    origin.set(b.docNo, b.source);
  }
  const real = new Set(origin.keys());
  const keyed = blocks.map((b) => ({ b, k: canonicalSortKey(b.docNo, real) }));
  keyed.sort((x, y) => compareKeys(x.k, y.k));
  const ordered = keyed.map((x) => x.b);
  // Within a file the order is compose's own emit order and is authoritative; the
  // derived key may interleave files but must never move a document backwards past
  // another from the same file — any disagreement with compose fails here, loudly.
  const last = new Map<string, number>();
  for (const b of ordered) {
    const prev = last.get(b.source) ?? -1;
    if (b.index <= prev)
      throw new AtlasSourceError(
        `document ordering moved ${b.docNo} backwards within ${b.source} (position ${b.index} after ${prev}) — canonicalSortKey and upstream compose disagree`,
      );
    last.set(b.source, b.index);
  }
  return ordered.flatMap((b) => b.lines);
}

