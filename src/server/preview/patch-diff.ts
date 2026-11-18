// Preview diff rendering on top of the shared diff core (src/lib/diffCore.ts —
// the same LCS / word-diff / pairing the live history pipeline uses), producing
// the DiffLine[] shape <DiffView> renders.
//
// One entry point: contentDiff — identity diff of one doc's content across two
// atlases. A GitHub-patch parser lived here too, for the days when a preview's
// changed documents were derived from changed FILE PATHS; snapshot.ts now diffs
// uuid-keyed snapshots instead, so nothing supplies a unified patch any more.

import type { DiffLine } from "../../lib/history";
import { lcsOps, pairAdjacentLines, trimContext } from "../../lib/diffCore";

// Identity diff: two versions of the SAME doc's content → DiffLine[]. NOTE:
// compares against CURRENT main, not the merge base — if main edited the same
// doc after the fork branched, those edits appear too ("vs live atlas").
// Uncapped: every changed line is kept, with ±2 lines of context around each
// hunk. Readers that need a bound (the chat and MCP preview tools) cap it
// themselves with renderPatch (bundle-read.ts).
export function contentDiff(prev: string, curr: string): DiffLine[] {
  if (prev === curr) return [];
  // "" means NO lines, not one empty line — split would yield [""] and emit a
  // spurious ["-",""] when diffing against empty (brand-new doc content).
  const a = prev === "" ? [] : prev.split("\n");
  const b = curr === "" ? [] : curr.split("\n");
  return trimContext(pairAdjacentLines(lcsOps(a, b)));
}
