// The one object every transfer shape receives, plus the readers they share:
// a doc's prose and the entity a prose party name refers to.
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
  /** Sender of treasury disbursements. Phase 1 always registers it. */
  skyCore: Entity;
  stats: TransferStats;
  /** Never-silent: counts and prints a doc that looks like a shape but fails to parse. */
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

// Directory docs ("The documents herein record …" / "The subdocuments
// herein set out …") are containers, not events.
const DIRECTORY_RE = /^The (?:sub)?documents? herein\b/i;
// Markdown links inject doc_no dots into sentences ("specified in [A.6.1.… -
// Title](uuid)") which break the [^.] sentence-boundary classes — strip them
// entirely before matching.
const stripLinks = (s: string): string => s.replace(/\[[^\]]*\]\([^)]*\)/g, "");

/** A doc's prose with markdown links stripped, or null for a directory doc. */
export function eventProse(d: Doc): string | null {
  const content = stripLinks(d.content ?? "");
  return DIRECTORY_RE.test(content.trim()) ? null : content;
}

// Prose names that refer to Sky-side system accounts rather than entities.
const PARTY_ALIASES = new Map([
  ["skypauseproxy", "sky-core"],
  ["sky", "sky-core"],
]);

function knownParty(ctx: TransferCtx, name: string): Entity | undefined {
  // "Spark SubProxy Account" / "Grove SubProxy" → the agent
  const acct = name.match(/^(.+?)\s+(?:SubProxy(?:\s+Account)?|Account)$/i);
  // Prose refers to multisigs without the suffix ("the Core Council
  // Buffer") while Pattern 17 names them from the threshold sentence
  // ("Core Council Buffer Multisig") — try the suffixed form last.
  return (
    ctx.nameIndex.get(normalizeKey(name)) ??
    (acct ? ctx.nameIndex.get(normalizeKey(acct[1])) : undefined) ??
    ctx.nameIndex.get(normalizeKey(`${name} Multisig`))
  );
}

/** The entity a prose party name refers to. With `create`, an unknown name mints a transfer_party. */
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

// Longest trailing run of capitalized tokens: "The SPK Company Ltd account
// holder" → "" (lowercase tail), "yesterday SPK Company Ltd" → "SPK Company Ltd".
export function trailingProperNoun(s: string): string {
  const tokens = s.trim().split(/\s+/);
  let start = tokens.length;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^[A-Z0-9]/.test(tokens[i])) start = i;
    else break;
  }
  return tokens.slice(start).join(" ");
}

// A sender capture can carry sentence lead-in ("The X account will…"), so an
// existing entity is tried on the raw capture, then on its trailing proper noun.
export function resolveKnownSender(ctx: TransferCtx, fromRaw: string, sourceDoc: Doc): Entity | null {
  return (
    resolveParty(ctx, fromRaw, sourceDoc, { create: false }) ??
    resolveParty(ctx, trailingProperNoun(fromRaw), sourceDoc, { create: false })
  );
}
