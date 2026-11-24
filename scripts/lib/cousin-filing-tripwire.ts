// Warns when a Prime Agent ICD is filed under a heading shape the reader's
// cousin matching does not recognise (src/lib/cousinFiling.ts). Such ICDs get
// narrow cousin lists rather than wrong ones, so nothing else would notice.
import { headingTitles, icdFiling } from "../../src/lib/cousinFiling.ts";
import { isICD } from "./graph-patterns.mjs";
import type { Doc } from "./graph-records.ts";

export function checkCousinFilingTripwire(allDocs: Doc[], docByDocNo: Map<string, Doc>): number {
  const titleOf = (docNo: string) => docByDocNo.get(docNo)?.title;
  // fragile: doc_no prefix — A.6.1.1, the same gate addPrimitiveInstances uses
  const unknown = allDocs.filter(
    (d) => isICD(d) && d.doc_no.startsWith("A.6.1.1.") && icdFiling(headingTitles(d.doc_no, titleOf)).kind === "unknown",
  );
  if (unknown.length === 0) return 0;
  console.warn(
    "  [drift] tripwire: Prime Agent ICDs filed under an unrecognised heading shape — " +
      "the reader narrows their cousin lists; teach src/lib/cousinFiling.ts the new shape",
  );
  console.log(`  cousin filing unrecognised (${unknown.length}): ${unknown.slice(0, 5).map((d) => d.doc_no).join(", ")}`);
  return unknown.length;
}
