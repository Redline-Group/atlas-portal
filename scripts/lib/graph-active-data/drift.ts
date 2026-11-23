// Drift detector: Active Data tables that hold rows but are not extracted.
// Fires when any Active Data doc outside the handled and known-ignored sets
// gains table rows, e.g. a per-instance payment ledger or the Registered
// Multisigs registry. Loud by design.
import { tableRows, type ActiveDataCtx } from "./context.ts";

// Tables deliberately not extracted (the drift detector skips them):
// Registered Spell Checklists — external GitHub URLs, no graph value.
// Current/Previous Sky Direct Exposures — rows name assets/pools ("Treasury
// Bills", "Uniswap Pools"), not actors, and attribution ("Investments by Grove
// in ... on Ethereum Mainnet") lives in a free-text Description cell. None of
// the existing entity_types fit a designated-exposure row; modeling one (and
// parsing the attribution prose) is a deliberate deferral, not a mechanical
// regex extension — see parse-atlas SKILL.md Pattern 16 addendum.
// Approved Deviations — a registry of exceptions to the default multisig
// signer/threshold config (Pattern 17), keyed by Liquidity Layer name +
// multisig address, not by a named actor. A row ("Spark Liquidity Layer" /
// `0x90D8c80C028B4C09C0d8dcAab9bbB057F0513431` / "Two (2) of four (4) signing
// requirement, with signers controlled by Phoenix Labs and VoteWizard") reads
// as free-text prose in the third column, not a structured field — same
// deferral shape as the Sky Direct Exposures tables above, not a Pattern 16
// fit. An extractor would need to resolve the Multisig Address column
// against the Pattern 17 multisig entity (by address) and treat the
// Approved Deviation cell as an alternate-config annotation on it.
//
// Current Non-Circulating Balance Positions — Holder | Position | Network rows
// name balance positions ("SubProxy", "PSM3 reserves"), not actors; the
// Position cell is free text that only resolves against an address elsewhere.
// Same deferral as the Sky Direct Exposures tables above (no existing
// entity_type fits a position row; see parse-atlas SKILL.md Pattern 16
// addendum).
const KNOWN_UNEXTRACTED_TABLES = new Set([
  "93f5b36b-06a7-4282-9fd7-14e0cbafd08e", // A.1.10.2.5.1.3.2.0.6.1
  "5f368e33-7a82-4244-a9ba-f285193ec043", // A.2.2.10.1.1.1.1.2.0.6.1 List Of Current Sky Direct Exposures
  "86fce840-f7f3-4617-bb58-d04db8731c9d", // A.2.2.10.1.1.1.1.3.0.6.1 List Of Previous Sky Direct Exposures
  "c304cb9f-ab10-4d5b-8f94-588170b36a9e", // A.2.2.10.1.1.1.6.2.1.3.1.0.6.1 Approved Deviations
  "d72aeeb3-e87d-4743-a870-5d8a6a4726f9", // A.3.5.3.2.1.1.1.0.6.1 Current Non-Circulating Balance Positions
]);

/** Warns once per unextracted Active Data table that holds rows, and counts them on the stats. */
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
