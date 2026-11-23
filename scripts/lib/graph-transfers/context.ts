import { normalizeKey, buildNameIndex, makeWarn, createProseParty } from "../graph-patterns.mjs";
import type { AddEntity, Doc, Edge, Entity } from "../graph-records.ts";

export interface TransferStats {
  grants: number;
  genesis: number;
  authorizations: number;
  allocations: number;
  budgetTransfers: number;
  planned: number;
  dataGaps: number;
  warnings: number;
}

export interface TransferCtx {
  allDocs: Doc[];
  docByDocNo: Map<string, Doc>;
  entityMap: Map<string, Entity>;
  nameIndex: Map<string, Entity>;
  edges: Edge[];
  addEntity: AddEntity;
  skyCore: Entity;
  stats: TransferStats;
  warn: (msg: string) => void;
}

export function createContext(
  allDocs: Doc[],
  docByDocNo: Map<string, Doc>,
  entityMap: Map<string, Entity>,
  edges: Edge[],
  addEntity: AddEntity,
): TransferCtx {
  const stats = { grants: 0, genesis: 0, authorizations: 0, allocations: 0, budgetTransfers: 0, planned: 0, dataGaps: 0, warnings: 0 };
  return {
    allDocs,
    docByDocNo,
    entityMap,
    nameIndex: buildNameIndex(entityMap),
    edges,
    addEntity,
    skyCore: entityMap.get("sky-core") as Entity,
    stats,
    warn: makeWarn("  transfers:", stats),
  };
}

const DIRECTORY_RE = /^The (?:sub)?documents? herein\b/i;
// Links inject doc_no dots that break the [^.] sentence-boundary classes.
const stripLinks = (s: string): string => s.replace(/\[[^\]]*\]\([^)]*\)/g, "");

export function eventProse(d: Doc): string | null {
  const content = stripLinks(d.content ?? "");
  return DIRECTORY_RE.test(content.trim()) ? null : content;
}

const PARTY_ALIASES = new Map([
  ["skypauseproxy", "sky-core"],
  ["sky", "sky-core"],
]);

function knownParty(ctx: TransferCtx, name: string): Entity | undefined {
  const acct = name.match(/^(.+?)\s+(?:SubProxy(?:\s+Account)?|Account)$/i);
  // Prose drops the "Multisig" suffix Pattern 17 names multisigs with.
  return (
    ctx.nameIndex.get(normalizeKey(name)) ??
    (acct ? ctx.nameIndex.get(normalizeKey(acct[1])) : undefined) ??
    ctx.nameIndex.get(normalizeKey(`${name} Multisig`))
  );
}

export function resolveParty(ctx: TransferCtx, rawName: string, sourceDoc: Doc, { create = true } = {}): Entity | null {
  const name = rawName.trim().replace(/^the\s+/i, "").trim();
  if (!name) return null;
  const alias = PARTY_ALIASES.get(normalizeKey(name));
  if (alias) return ctx.entityMap.get(alias) ?? null;
  const known = knownParty(ctx, name);
  if (known) return known;
  if (!create) return null;
  return createProseParty(ctx.addEntity, ctx.nameIndex, name, "transfer_party", sourceDoc);
}

// Longest trailing run of capitalized tokens; "" when the string ends lowercase.
export function trailingProperNoun(s: string): string {
  const tokens = s.trim().split(/\s+/);
  let start = tokens.length;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^[A-Z0-9]/.test(tokens[i])) start = i;
    else break;
  }
  return tokens.slice(start).join(" ");
}

// A sender capture can carry sentence lead-in ("The X account will…").
export function resolveKnownSender(ctx: TransferCtx, fromRaw: string, sourceDoc: Doc): Entity | null {
  return (
    resolveParty(ctx, fromRaw, sourceDoc, { create: false }) ??
    resolveParty(ctx, trailingProperNoun(fromRaw), sourceDoc, { create: false })
  );
}
