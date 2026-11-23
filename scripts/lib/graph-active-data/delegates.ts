// The three delegate registries: Current Aligned Delegates, Derecognized
// Delegates and the Aligned Delegate Breach Registry.
import { slugify, normalizeKey, buildNameIndex } from "../graph-patterns.mjs";
import { extractEthAddresses, extractUrl, type TableRow } from "../table-parser.ts";
import { patchEntityMeta, type Doc, type Entity } from "../graph-records.ts";
import { addTableEntity, linkAddress, listIn, tableRows, type ActiveDataCtx, type ActiveDataTable } from "./context.ts";

const CURRENT_DELEGATES_UUID = "5f584db8-f8d8-4118-988c-b2bc3f68ceb7";
const DERECOGNIZED_UUID = "e7aec672-ed19-4329-aaf7-736950be2eb7";
const BREACH_REGISTRY_UUID = "1ddd9cf6-3f93-4a33-8c1d-80405eec1ffb"; // A.1.6.6.1.3.0.6.1

const EA_ADDRESS = { address: "delegate", edge: "ea_address" };
const DELEGATION_CONTRACT = { address: "delegate", edge: "delegation_contract" };

interface DelegateRow {
  name: string;
  eaAddr: string;
  contractAddr: string | undefined;
  forumUrl: string | null;
}

// A row counts only with a name and an EA address: the address is its identity.
function readDelegateRow(row: TableRow): DelegateRow | null {
  const name = row["Delegate Name"]?.trim();
  const eaAddr: string | undefined = extractEthAddresses(row["EA Address"] ?? "")[0];
  if (!name || !eaAddr) return null;
  const contractAddr: string | undefined = extractEthAddresses(row["Delegation Contract"] ?? "")[0];
  return { name, eaAddr, contractAddr, forumUrl: extractUrl(row["Forum Post"] ?? "") };
}

// Enrich: add forum_url to meta, update has_address edge roles.
// Also upgrade ecosystem_actor → delegate_org (e.g. entities that appear
// in the ERG list get created as ecosystem_actor first; delegate table wins).
function enrichDelegate(ctx: ActiveDataCtx, entity: Entity, row: DelegateRow): Entity {
  if (entity.entity_type === "ecosystem_actor") entity.entity_type = "delegate_org";
  patchEntityMeta(entity, row.forumUrl ? { forum_url: row.forumUrl } : {});
  for (const edge of ctx.edges) {
    if (edge.edgeType !== "has_address" || edge.fromId !== entity.id) continue;
    const addr = edge.toId.split(":")[0];
    if (addr === row.eaAddr) edge.meta = JSON.stringify({ role: "ea_address" });
    else if (row.contractAddr && addr === row.contractAddr) edge.meta = JSON.stringify({ role: "delegation_contract" });
  }
  ctx.stats.enriched++;
  return entity;
}

// New entity — register addresses, emit has_address edges
function createDelegate(ctx: ActiveDataCtx, row: DelegateRow): Entity {
  const meta = { source: "active_data_table", forum_url: row.forumUrl };
  const ent = addTableEntity(ctx, row.name, "delegate_org", 1, CURRENT_DELEGATES_UUID, meta);
  linkAddress(ctx, ent, row.eaAddr, EA_ADDRESS, row.name);
  if (row.contractAddr) linkAddress(ctx, ent, row.contractAddr, DELEGATION_CONTRACT, `${row.name} Delegation Contract`);
  ctx.stats.created++;
  return ent;
}

// --- Table 1: Current Aligned Delegates ---
// A delegate bootstrapped from the chainlog is found by its EA address and
// enriched; one absent from the chainlog is created.
function extractCurrentDelegates(ctx: ActiveDataCtx, doc: Doc): void {
  for (const tableRow of tableRows(doc)) {
    const row = readDelegateRow(tableRow);
    if (!row) continue;
    const ownerId = ctx.addrToEntityId.get(row.eaAddr);
    const known = ownerId ? ctx.entityById.get(ownerId) : undefined;
    const entity = known ? enrichDelegate(ctx, known, row) : createDelegate(ctx, row);
    listIn(ctx, entity, CURRENT_DELEGATES_UUID);
    // Inclusion in this registry IS Aligned Delegate recognition (Pattern 10),
    // so the role edge is emitted from the row.
    if (!ctx.skyGovernance) continue;
    ctx.edges.push({
      fromId: entity.id, fromType: "entity", toId: ctx.skyGovernance.id, toType: "entity",
      edgeType: "aligned_delegate_for", sourceDocNos: [doc.doc_no],
    });
  }
}

// --- Table 2: Derecognized Alignment Conservers ---
function extractDerecognized(ctx: ActiveDataCtx, doc: Doc): void {
  for (const row of tableRows(doc)) {
    const name = row["Identity"]?.trim();
    if (!name || name === "-" || ctx.entityMap.has(slugify(name))) continue;
    const ent = addTableEntity(ctx, name, "delegate_org", 0, DERECOGNIZED_UUID, {
      source: "active_data_table",
      derecognition_date: row["Date"]?.trim(),
      forum_url: extractUrl(row["Reasoning Post"] ?? ""),
    });
    listIn(ctx, ent, DERECOGNIZED_UUID);
    ctx.stats.derecognized++;
  }
}

// --- Table 5: Aligned Delegate Breach Registry ---
// Columns: Date | Identity | Breach Tier | Reasoning Post. Rows are dated
// governance events attached to existing delegate entities via listed_in.
function extractBreaches(ctx: ActiveDataCtx, doc: Doc): void {
  const nameIndex = buildNameIndex(ctx.entityMap);
  for (const row of tableRows(doc)) {
    const identity = row["Identity"]?.trim();
    if (!identity) continue;
    let entity = nameIndex.get(normalizeKey(identity));
    if (!entity) {
      entity = addTableEntity(ctx, identity, "delegate_org", 1, BREACH_REGISTRY_UUID, { source: "breach_registry_table" });
      nameIndex.set(normalizeKey(identity), entity);
    }
    listIn(ctx, entity, BREACH_REGISTRY_UUID, {
      date: row["Date"]?.trim(),
      breach_tier: row["Breach Tier"]?.trim(),
      reasoning_url: extractUrl(row["Reasoning Post"] ?? "") ?? undefined,
    });
    ctx.stats.breaches++;
  }
}

export const currentDelegatesTable: ActiveDataTable = { uuid: CURRENT_DELEGATES_UUID, extract: extractCurrentDelegates };
export const derecognizedTable: ActiveDataTable = { uuid: DERECOGNIZED_UUID, extract: extractDerecognized };
export const breachRegistryTable: ActiveDataTable = { uuid: BREACH_REGISTRY_UUID, warnAs: "Breach Registry", extract: extractBreaches };
