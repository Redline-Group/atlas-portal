/**
 * Heading levels — port of sync/partition.py (structural_depth /
 * restore_absolute_levels). Bucket files store levels relative to their own root
 * document; the composed Atlas's absolute level is `min(structural_depth + 1, 6)`
 * and is RE-DERIVED from doc numbers, never adjusted from the stored hashes: the
 * hash count is lossy (10k+ docs sit at the cap), so subtracting a root level
 * would flatten every capped document onto the wrong level.
 * Part of atlas-source.mjs, which re-exports these; nothing else imports this module.
 */

import { HEADING_RE } from "./atlas-parser.mjs";

export const MAX_HEADING_LEVEL = 6;

/** How many documents sit above `docNo`. Segment count is NOT depth: `0`
 *  extension segments (`A.1.4.5.0.4`) and the leading `A` are phantoms no
 *  document claims. An ancestor counts precisely when some document claims that
 *  prefix — the same real/phantom test upstream's canonical_sort_key applies. */
export function structuralDepth(docNo: string, realDocNos: Set<string>): number {
  const parts = docNo.split(".");
  let n = 0;
  for (let i = 1; i < parts.length; i++) if (realDocNos.has(parts.slice(0, i).join("."))) n++;
  return n;
}

/** Give every heading in a reassembled stream its level in the composed Atlas.
 *  Needed Research has no position of its own and takes the level of the
 *  numbered document it follows, plus one, under the same cap (matches compose).
 *  Only heading lines change; node content (and therefore contentHash) is
 *  byte-identical before and after. */
export function restoreAbsoluteLevels(text: string): string {
  const lines = text.split("\n");
  const heads: Array<[number, string]> = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_RE.exec(lines[i]!);
    if (m) heads.push([i, m[2]]);
  }
  const real = new Set(heads.map(([, dn]) => dn).filter((dn) => !dn.startsWith("NR-")));
  let previous = 0;
  for (const [i, dn] of heads) {
    let level: number;
    if (dn.startsWith("NR-")) {
      level = Math.min(previous + 1, MAX_HEADING_LEVEL);
    } else {
      level = Math.min(structuralDepth(dn, real) + 1, MAX_HEADING_LEVEL);
      previous = level;
    }
    lines[i] = lines[i]!.replace(/^#+/, "#".repeat(level));
  }
  return lines.join("\n");
}
