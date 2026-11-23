// The drift detector for Active Data tables no extractor reads: it fires when
// an Active Data document outside the handled and known-unextracted sets
// gains table rows (a per-instance payment ledger, a new registry). Loud by
// design. A table another module reads by title is named here, beside it.
import { APPROVED_LIST_RE } from "./graph-nfat-facilities.ts";

interface Doc {
  id: string;
  doc_no: string;
  title: string;
  type?: string;
  content?: string;
}
type Row = Record<string, string | undefined>;

/** Read by graph-nfat-facilities.ts, which marks each listed facility approved. */
const READ_BY_TITLE = [APPROVED_LIST_RE];

/** Warns for each unread Active Data table that holds rows; returns how many. */
export function warnUnextractedTables(allDocs: Doc[], read: Set<string>, parseTable: (content: string) => Row[]): number {
  let warnings = 0;
  for (const d of allDocs) {
    if (d.type !== "Active Data" || read.has(d.id) || READ_BY_TITLE.some((re) => re.test(d.title))) continue;
    const rows = parseTable(d.content ?? "").filter((row) => Object.values(row).some((v) => v && v.trim()));
    if (!rows.length) continue;
    warnings++;
    console.warn(`  [drift] unextracted Active Data table: ${d.doc_no} "${d.title}" (${d.id}, ${rows.length} rows)`);
  }
  if (warnings) console.warn(`  [drift] ${warnings} Active Data table(s) contain rows but are not extracted`);
  return warnings;
}
