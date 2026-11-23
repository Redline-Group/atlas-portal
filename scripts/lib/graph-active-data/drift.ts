// Warns when an Active Data table holds rows but nothing extracts it.
import { tableRows, type ActiveDataCtx } from "./context.ts";

// Rows name assets, positions or config exceptions, not actors; see parse-atlas SKILL.md Pattern 16 addendum.
const KNOWN_UNEXTRACTED_TABLES = new Set([
  "93f5b36b-06a7-4282-9fd7-14e0cbafd08e", // A.1.10.2.5.1.3.2.0.6.1
  "5f368e33-7a82-4244-a9ba-f285193ec043", // A.2.2.10.1.1.1.1.2.0.6.1 List Of Current Sky Direct Exposures
  "86fce840-f7f3-4617-bb58-d04db8731c9d", // A.2.2.10.1.1.1.1.3.0.6.1 List Of Previous Sky Direct Exposures
  "c304cb9f-ab10-4d5b-8f94-588170b36a9e", // A.2.2.10.1.1.1.6.2.1.3.1.0.6.1 Approved Deviations
  "d72aeeb3-e87d-4743-a870-5d8a6a4726f9", // A.3.5.3.2.1.1.1.0.6.1 Current Non-Circulating Balance Positions
]);

export function warnUnextractedTables(ctx: ActiveDataCtx, handledUuids: Set<string>): void {
  for (const d of ctx.allDocs) {
    if (d.type !== "Active Data") continue;
    if (handledUuids.has(d.id) || KNOWN_UNEXTRACTED_TABLES.has(d.id)) continue;
    const rows = tableRows(d).filter((row) => Object.values(row).some((v) => v && v.trim()));
    if (!rows.length) continue;
    ctx.stats.driftWarnings++;
    console.warn(`  [drift] unextracted Active Data table: ${d.doc_no} "${d.title}" (${d.id}, ${rows.length} rows)`);
  }
  if (ctx.stats.driftWarnings) {
    console.warn(`  [drift] ${ctx.stats.driftWarnings} Active Data table(s) contain rows but are not extracted`);
  }
}
