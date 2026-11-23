/**
 * Transfer/grant event extraction (Pattern 18) for build-graph.
 *
 * Completed or planned token movements become `funds_transfer` edges (sender
 * entity → recipient entity; meta carries amounts/tx hash/status). Atlas docs
 * that authorize or describe recurring payments, but do not record transfer
 * rows, become `funds_authorization` edges instead so chat/reporting can say
 * exactly where payment data should exist without implying ledger coverage.
 * Planned transfer docs that name a source but defer amount/recipient details
 * become `funds_data_gap` records tied to the source doc/entity.
 *
 *  A. Grant docs under A.2.13 (isGrantDoc) — structured bullet lists:
 *       - Recipient: Sky Frontier Foundation
 *       - Recipient Address: `0x…`
 *       - Transaction Hash: `0x…`
 *       - USDS amount: 50,000,000
 *     Sender is Sky (treasury disbursement approved by governance) → sky-core.
 *
 *  B. Genesis token distribution narratives (docs titled "Minting Of Tokens…"
 *     / "Transfer Of Tokens…" under agent artifacts):
 *       "SPK Company Ltd transferred 6.5 billion SPK tokens … to the Sky
 *        Pause Proxy."  (past tense = completed; "will transfer" = planned)
 *
 *  C. Accord grant authorizations (title contains "Grant Authorization")
 *     become `funds_authorization`, not `funds_transfer`:
 *       "… grant of 800,000 USDS per month to the Grove Foundation from
 *        Grove's Prime Treasury for a three (3) month period …"
 *     Both "per month" and the "for a N month period" tail are optional —
 *     single-month/one-time grants drop the recurrence entirely ("… grant
 *     of 800,000 USDS to the Grove Foundation from Grove's Prime Treasury
 *     for July 2026", "… one-time cash grant of 700,000 USDS to the Skybase
 *     Foundation from Skybase's SubProxy …"). Source can be a Treasury or a
 *     SubProxy.
 *
 *  D. Accord capital allocations (title ends "Initial Allocation" / "Genesis
 *     Capital Allocation"), as one sentence or an enumerated list.
 *
 *  E. Executed budget transfers ("X has transferred N TOKEN from … to Y").
 *
 * Never-silent: docs that look like one of the shapes but fail to parse are
 * warned about individually.
 */

import type { AddEntity, Doc, Edge, Entity } from "./graph-records.ts";
import { createContext, type TransferCtx, type TransferStats } from "./graph-transfers/context.ts";
import { extractGrants, extractGrantAuthorizations } from "./graph-transfers/grants.ts";
import { extractGenesis } from "./graph-transfers/genesis.ts";
import { extractAllocations } from "./graph-transfers/allocations.ts";
import { extractBudgetTransfers } from "./graph-transfers/budget-transfers.ts";

// Shapes A to E, in this order: a party one shape mints resolves by name in
// the shapes after it.
const SHAPES: ((ctx: TransferCtx) => void)[] = [
  extractGrants,
  extractGenesis,
  extractGrantAuthorizations,
  extractAllocations,
  extractBudgetTransfers,
];

export function extractTransfers(
  allDocs: Doc[],
  _docById: Map<string, Doc>,
  docByDocNo: Map<string, Doc>,
  entityMap: Map<string, Entity>,
  edges: Edge[],
  addEntity: AddEntity,
): TransferStats {
  const ctx = createContext(allDocs, docByDocNo, entityMap, edges, addEntity);
  for (const shape of SHAPES) shape(ctx);
  return ctx.stats;
}
