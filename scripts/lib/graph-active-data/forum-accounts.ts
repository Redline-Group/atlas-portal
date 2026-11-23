// --- Table 4: Current Authorized Forum Accounts ---
import { normalizeKey, buildNameIndex, resolveAliasedEntity } from "../graph-patterns.mjs";
import type { TableRow } from "../table-parser.ts";
import { entityMeta, patchEntityMeta, type Doc, type Entity } from "../graph-records.ts";
import { addTableEdge, addTableEntity, listIn, tableRows, type ActiveDataCtx, type ActiveDataTable } from "./context.ts";

const FORUM_ACCOUNTS_UUID = "b71564fd-22e0-4c69-99d1-5b23fc1fa329"; // A.2.7.1.1.1.1.4.0.6.1
const NA = "N/A";
type NameIndex = Map<string, Entity>;

// Keeps the short form searchable once it has merged into the full-name entity.
function addAlias(entity: Entity, alias: string): void {
  const aliases = new Set((entityMeta(entity).aliases as string[] | undefined) ?? []);
  aliases.add(alias);
  patchEntityMeta(entity, { aliases: [...aliases] });
}

function registerInIndex(nameIndex: NameIndex, e: Entity): void {
  for (const key of [normalizeKey(e.name), normalizeKey(e.slug)]) if (key && !nameIndex.has(key)) nameIndex.set(key, e);
}

function resolveListed(ctx: ActiveDataCtx, nameIndex: NameIndex, name: string, meta: object, subtype?: string): Entity {
  const known = resolveAliasedEntity(nameIndex, ctx.entityMap, name);
  if (!known) {
    const created = addTableEntity(ctx, name, "ecosystem_actor", 1, FORUM_ACCOUNTS_UUID, meta);
    if (subtype) created.subtype = subtype;
    registerInIndex(nameIndex, created);
    return created;
  }
  nameIndex.set(normalizeKey(name), known); // cache the short-name alias too
  if (normalizeKey(name) !== normalizeKey(known.name) && normalizeKey(name) !== normalizeKey(known.slug)) addAlias(known, name);
  return known;
}

function listAccount(ctx: ActiveDataCtx, nameIndex: NameIndex, row: TableRow, name: string): Entity {
  const entity = resolveListed(ctx, nameIndex, name, { source: "forum_accounts_table" });
  const handle = row["Entity Handle"]?.trim();
  const role = row["Role"]?.trim();
  patchEntityMeta(entity, {
    ...(handle && handle !== NA ? { forum_handle: handle } : {}),
    ...(role && role !== NA ? { forum_role: role } : {}),
  });
  listIn(ctx, entity, FORUM_ACCOUNTS_UUID, {
    handle: handle !== NA ? handle : undefined,
    role: role !== NA ? role : undefined,
  });
  ctx.stats.forumRows++;
  return entity;
}

function repHandles(row: TableRow): string[] {
  const raw = (row["Handles of Authorized Representatives"] ?? "").replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (!raw || raw === NA) return [];
  return raw.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
}

function linkReps(ctx: ActiveDataCtx, nameIndex: NameIndex, account: Entity, row: TableRow): void {
  for (const handle of repHandles(row)) {
    const meta = { source: "forum_accounts_table", forum_handle: handle };
    const rep = resolveListed(ctx, nameIndex, handle, meta, "individual");
    if (rep.id === account.id) continue;
    addTableEdge(ctx, rep.id, account.id, "entity", "authorized_rep_for", { handle });
    ctx.stats.forumReps++;
  }
}

function extractForumAccounts(ctx: ActiveDataCtx, doc: Doc): void {
  const nameIndex = buildNameIndex(ctx.entityMap);
  for (const row of tableRows(doc)) {
    const name = row["Entity Name"]?.trim();
    if (!name || name === NA) continue;
    linkReps(ctx, nameIndex, listAccount(ctx, nameIndex, row, name), row);
  }
}

export const forumAccountsTable: ActiveDataTable = { uuid: FORUM_ACCOUNTS_UUID, warnAs: "Forum Accounts", extract: extractForumAccounts };
