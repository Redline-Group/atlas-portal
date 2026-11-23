// Transfer/grant event extraction (Pattern 18) for build-graph.

import type { AddEntity, Doc, Edge, Entity } from "./graph-records.ts";
import { createContext, type TransferCtx, type TransferStats } from "./graph-transfers/context.ts";
import { extractGrants, extractGrantAuthorizations } from "./graph-transfers/grants.ts";
import { extractGenesis } from "./graph-transfers/genesis.ts";
import { extractAllocations } from "./graph-transfers/allocations.ts";
import { extractBudgetTransfers } from "./graph-transfers/budget-transfers.ts";

// Order matters: a party one shape mints resolves by name in the shapes after it.
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
