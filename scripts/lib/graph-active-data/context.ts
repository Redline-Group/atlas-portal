// The one object every Active Data table extractor receives, and the writers
// they share. Extractors mutate entityMap / edges / addressesAtlas /
// addressesRaw in place (the convention for phase modules, see
// graph-multisigs.mjs).
import { slugify, makeEntity } from "../graph-patterns.mjs";
import { parseMarkdownTable, type TableRow } from "../table-parser.ts";
import type { Doc, Edge, Entity } from "../graph-records.ts";

export interface ActiveDataStats {
  enriched: number;
  created: number;
  derecognized: number;
  srcMembers: number;
  forumRows: number;
  forumReps: number;
  breaches: number;
  driftWarnings: number;
}
/** Address artifact entries, keyed by address. This phase only adds entries. */
export type AddressBook = Record<string, object | undefined>;

export interface ActiveDataCtx {
  allDocs: Doc[];
  entityMap: Map<string, Entity>;
  entityById: Map<string, Entity>;
  edges: Edge[];
  addressesAtlas: AddressBook;
  addressesRaw: AddressBook;
  /** address (no chain suffix) → entity id, from the has_address edges earlier phases emitted */
  addrToEntityId: Map<string, string>;
  skyGovernance: Entity | undefined;
  stats: ActiveDataStats;
}

/** One extracted table: the Active Data doc that holds it and what its rows become. */
export interface ActiveDataTable {
  uuid: string;
  /** Names the table in the warning for an absent doc. A table without one is skipped silently. */
  warnAs?: string;
  extract(ctx: ActiveDataCtx, doc: Doc): void;
}

function addressOwners(edges: Edge[]): Map<string, string> {
  const owners = new Map<string, string>();
  for (const edge of edges) {
    if (edge.edgeType === "has_address" && edge.fromType === "entity") owners.set(edge.toId.split(":")[0], edge.fromId);
  }
  return owners;
}

export function createContext(
  allDocs: Doc[],
  entityMap: Map<string, Entity>,
  edges: Edge[],
  addressesAtlas: AddressBook,
  addressesRaw: AddressBook,
): ActiveDataCtx {
  return {
    allDocs,
    entityMap,
    entityById: new Map([...entityMap.values()].map((e) => [e.id, e])),
    edges,
    addressesAtlas,
    addressesRaw,
    addrToEntityId: addressOwners(edges),
    skyGovernance: entityMap.get("sky-governance"),
    stats: { enriched: 0, created: 0, derecognized: 0, srcMembers: 0, forumRows: 0, forumReps: 0, breaches: 0, driftWarnings: 0 },
  };
}

export const tableRows = (doc: Doc): TableRow[] => parseMarkdownTable(doc.content ?? "");

/** Registers a row's entity under its name's slug. A row replaces an entity already holding that slug. */
export function addTableEntity(ctx: ActiveDataCtx, name: string, entityType: string, isActive: number, tableUuid: string, meta: object): Entity {
  const entity = makeEntity(slugify(name), name, entityType, { defining_doc_id: tableUuid, is_active: isActive, meta });
  ctx.entityMap.set(entity.slug, entity);
  ctx.entityById.set(entity.id, entity);
  return entity;
}

export function addTableEdge(ctx: ActiveDataCtx, fromId: string, toId: string, toType: string, edgeType: string, meta: object | null): void {
  ctx.edges.push({ fromId, fromType: "entity", toId, toType, edgeType, meta: meta ? JSON.stringify(meta) : undefined });
}

/** entity → the table doc that lists it. */
export function listIn(ctx: ActiveDataCtx, entity: Entity, tableUuid: string, meta: object | null = null): void {
  addTableEdge(ctx, entity.id, tableUuid, "doc", "listed_in", meta);
}

/** entity → an ethereum address a row states, registering the address when the artifacts lack it. */
export function linkAddress(ctx: ActiveDataCtx, entity: Entity, addr: string, role: { address: string; edge: string }, label: string): void {
  if (!ctx.addressesAtlas[addr]) {
    const atlas = { chain: "ethereum", chains: ["ethereum"], roles: [role.address], entityLabel: label };
    ctx.addressesAtlas[addr] = atlas;
    ctx.addressesRaw[addr] = { ...atlas, label, aliases: [] };
  }
  addTableEdge(ctx, entity.id, `${addr}:ethereum`, "address", "has_address", { role: role.edge });
}
