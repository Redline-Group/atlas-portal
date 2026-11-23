/**
 * Active Data table entity extraction (Pattern 16) for build-graph, Phase 2.7.
 *
 * Parses five Active Data tables that contain named actors not captured by
 * the prose-pattern phases:
 *   - Current Aligned Delegates          (5f584db8) — delegate_org, is_active=1
 *   - Derecognized Delegates             (e7aec672) — delegate_org, is_active=0
 *   - SRC Membership Registry            (d9c6ed16) — src_member, is_active=1
 *   - Current Authorized Forum Accounts  (b71564fd) — named individuals/orgs
 *   - Aligned Delegate Breach Registry   (1ddd9cf6) — dated breach events
 *
 * For existing delegate_org entities (bootstrapped from chainlog addresses),
 * enriches meta with forum_url and updates has_address edge role metadata.
 * Creates new entities for delegates absent from the chainlog (e.g. BLUE,
 * Cloaky) and registers their addresses in addressesAtlas (written to
 * public/addresses.atlas.json, further enriched in Phase 4.5) and
 * addressesRaw (reflected in the Phase 3 address count).
 *
 * Also runs a drift detector: any other Active Data table that gains rows
 * warns loudly instead of being silently ignored.
 *
 * See .claude/skills/parse-atlas/SKILL.md Pattern 16 for the full reference.
 */

import type { Doc, Edge, Entity } from "./graph-records.ts";
import { createContext, type ActiveDataStats, type ActiveDataTable, type AddressBook } from "./graph-active-data/context.ts";
import { currentDelegatesTable, derecognizedTable, breachRegistryTable } from "./graph-active-data/delegates.ts";
import { srcMembersTable } from "./graph-active-data/src-members.ts";
import { forumAccountsTable } from "./graph-active-data/forum-accounts.ts";
import { warnUnextractedTables } from "./graph-active-data/drift.ts";

// Tables 1 to 5, extracted in this order: a later table resolves its names
// against the entities an earlier one registered.
const TABLES: ActiveDataTable[] = [
  currentDelegatesTable,
  derecognizedTable,
  srcMembersTable,
  forumAccountsTable,
  breachRegistryTable,
];

function logSummary(s: ActiveDataStats): void {
  console.log(
    `\n  Phase 2.7: ${s.enriched} delegates enriched, ${s.created} created,` +
      ` ${s.derecognized} derecognized, ${s.srcMembers} SRC members,` +
      ` ${s.forumRows} forum rows (${s.forumReps} rep edges), ${s.breaches} breaches`,
  );
}

// Runs after Phase 2.5 (ICD-param has_address edges) so `edges` already
// carries every entity → address link Table 1 needs for identity lookup, and
// after Phase 1 so `entityMap` already has sky-governance bootstrapped.
export function extractActiveData(
  allDocs: Doc[],
  docById: Map<string, Doc>,
  entityMap: Map<string, Entity>,
  edges: Edge[],
  addressesAtlas: AddressBook,
  addressesRaw: AddressBook,
): ActiveDataStats {
  const ctx = createContext(allDocs, entityMap, edges, addressesAtlas, addressesRaw);
  for (const table of TABLES) {
    const doc = docById.get(table.uuid);
    if (doc) table.extract(ctx, doc);
    else if (table.warnAs) console.warn(`  Phase 2.7: ${table.warnAs} doc (${table.uuid}) not found`);
  }
  logSummary(ctx.stats);
  warnUnextractedTables(ctx, new Set(TABLES.map((t) => t.uuid)));
  return ctx.stats;
}
