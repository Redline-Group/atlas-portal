// Active Data table entity extraction (Pattern 16) for build-graph, Phase 2.7.

import type { Doc, Edge, Entity } from "./graph-records.ts";
import { createContext, type ActiveDataStats, type ActiveDataTable, type AddressBook } from "./graph-active-data/context.ts";
import { currentDelegatesTable, derecognizedTable, breachRegistryTable } from "./graph-active-data/delegates.ts";
import { srcMembersTable } from "./graph-active-data/src-members.ts";
import { forumAccountsTable } from "./graph-active-data/forum-accounts.ts";
import { warnUnextractedTables } from "./graph-active-data/drift.ts";

// Order matters: a later table resolves names against entities an earlier one registered.
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

// Must run after Phase 2.5: Table 1 finds delegates by the has_address edges it emits.
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
