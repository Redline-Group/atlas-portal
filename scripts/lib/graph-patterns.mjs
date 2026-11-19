/**
 * Pure predicate functions, regexes, and content-extraction helpers for
 * pattern-driven graph extraction.
 */

import crypto from "node:crypto";

// Responsible Party prose readers live in their own module; re-exported so
// importers keep one entry point.
export {
  extractRP,
  extractAllRP,
  extractAutomation,
  isDescriptiveRP,
  rpRoleAndName,
} from "./graph-patterns-rp.ts";

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Deterministic, v4-shaped UUID derived from an entity slug. The same slug
// always yields the same id, so entities created in different build phases
// reconcile to one node. This is the entity-identity primitive for the whole
// graph — keep it the single definition.
function slugToId(slug) {
  const h = crypto.createHash("sha256").update(slug).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

// Build an entity record with the canonical field shape. Callers own their own
// get-or-create guard and registry bookkeeping (entityMap / entityById); this
// only constructs the object so the shape can't drift between phases.
export function makeEntity(slug, name, entity_type, { subtype, defining_doc_id, is_active = 1, meta } = {}) {
  return {
    id: slugToId(slug),
    slug,
    name,
    entity_type,
    subtype: subtype ?? null,
    defining_doc_id: defining_doc_id ?? null,
    is_active,
    meta: meta ? JSON.stringify(meta) : null,
  };
}

// ---------------------------------------------------------------------------
// Pattern matchers (doc_no / title-based; no hardcoded names)
// ---------------------------------------------------------------------------

export const isPrimeAgent = (d) => /^A\.6\.1\.1\.\d+$/.test(d.doc_no);
export const isExecutorAgent = (d) => /^A\.6\.1\.2\.\d+$/.test(d.doc_no);
export const isFacilitatorDoc = (d) => /^A\.6\.1\.2\.\d+\.1$/.test(d.doc_no);
export const isGovOpsDoc = (d) => /^A\.6\.1\.2\.\d+\.2$/.test(d.doc_no);
export const isActiveData = (d) => /\.0\.6\.\d+$/.test(d.doc_no);
export const isAnnotation = (d) => /\.(0\.[34]|\d+\.var\d+)(\.\d+)?$/.test(d.doc_no);
export const isEcosystemAccord = (d) => /^A\.2\.8\.2\.\d+$/.test(d.doc_no);
export const isPartyDetails = (d) => /^A\.2\.8\.2\.\d+\.1\.1\.\d+$/.test(d.doc_no);
export const isGrantDoc = (d) => /^A\.2\.13\.1\.\d+\.\d+$/.test(d.doc_no);
export const isICDLocation = (d) =>
  /instance configuration document location/i.test(d.title) ||
  /^\s*This Instance[’']s associated Instance Configuration Document is located at/i.test(
    d.content ?? "",
  );
export const isICD = (d) => /instance configuration document/i.test(d.title) && !isICDLocation(d);
export const isGlobalActivationStatus = (d) => /global activation status/i.test(d.title);

// Registry docs are anchored by UUID, never doc_no — atlas renumbering moved
// these from A.1.5.*/A.1.8.* to A.1.6.*/A.1.9.* (silently breaking the old
// doc_no constants). Doc_nos for source citations are derived at runtime.
export const ERG_MEMBERSHIP_UUID = "e9807449-fdc3-4860-8d53-c56181311618"; // A.1.9.1.2.2.0.6.1
export const ALIGNED_DELEGATES_UUID = "5f584db8-f8d8-4118-988c-b2bc3f68ceb7"; // A.1.6.1.5.0.6.1
// "Current Level N Ranked Delegates" docs (Pattern 10).
export const RANKED_DELEGATE_UUIDS = new Map([
  [1, "46c0f334-4421-4e1a-9130-501e3a246e2a"], // A.1.6.4.1.1.3.1
  [2, "ebe4da3b-2674-4ee1-b7a8-3d7a4b37fe75"], // A.1.6.4.1.2.3.1
]);
// "Spell Team Configuration" — names the rotating spell crafting/reviewing teams.
export const SPELL_TEAM_UUID = "4862ed4e-097b-42fa-a197-1d407d220a77"; // A.1.10.2.2.2.1

// A.1.7.1 — "Active Ecosystem Actors" section. Each direct child is a role
// definition doc; its .2 child is the "Designated X" binding doc that names
// the holder. Walk from here to discover all role bindings automatically.
export const ACTIVE_ECOSYSTEM_ACTORS_UUID = "1ef5767b-60bc-446a-af45-4eccdb20c023";

// Structural anchor: the first known binding doc. Used as a sanity check
// that the A.1.7.1 walk is still finding the right section.
export const CCRA_BINDING_UUID = "51b1fe46-2251-4078-a805-e2b40aaaf729";

// Shared regexes (UUID links, accord parties, org-to-org prose) and the
// bullet-field factory live in their own module; re-exported so importers keep
// one entry point.
export {
  UUID_SRC,
  UUID_LINK_RE,
  MD_URL_RE,
  COMPRISES_RE,
  ATOMIC_PARTY_RE,
  PRIME_FOUNDATION_RE,
  PROVIDES_SERVICES_RE,
  cleanOrgProseName,
  bulletField,
} from "./graph-patterns-regex.ts";

// Per-module warning emitter. Every Phase 2.8 pattern is "never-silent": a doc
// that looks like one of its shapes but fails to parse warns instead of being
// dropped, and the count rides home in the module's stats line. `tag` is the
// module's console prefix, kept verbatim ("  bridge:", "  [omni]").
export function makeWarn(tag, stats) {
  return (msg) => {
    stats.warnings++;
    console.warn(`${tag} ${msg}`);
  };
}

// Group docs by parent doc_no, slotting each by a caller-supplied child-kind
// classifier. The shape behind Patterns 17 and 21: both detect a root by the
// SET of children it owns, never by the root's own title (multisig roots are
// not uniformly titled; "Validators" containers share a title with rosters).
// Keys on the doc_no string rather than resolving the parent doc, because a
// parent that does not exist must still collect its children (the caller
// decides what an orphaned group means). First writer wins per (parent, kind).
export function groupChildrenByParent(allDocs, kindOf) {
  const byParent = new Map(); // parent doc_no → { [kind]: doc }
  for (const d of allDocs) {
    const kind = kindOf(d);
    if (!kind) continue;
    const parentDocNo = d.doc_no.split(".").slice(0, -1).join(".");
    let slot = byParent.get(parentDocNo);
    if (!slot) {
      slot = {};
      byParent.set(parentDocNo, slot);
    }
    if (!slot[kind]) slot[kind] = d;
  }
  return byParent;
}

// ---------------------------------------------------------------------------
// Entity name resolution helpers
// ---------------------------------------------------------------------------

// Collapse a name to a comparison key: "Soter Labs" / "SoterLabs" / "soter-labs"
// all → "soterlabs". Used to match registry-table names and prose mentions
// against existing entities whose casing/punctuation differs.
export function normalizeKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Build a normalizeKey → entity lookup over the current entityMap (names and
// slugs both indexed; first writer wins so Phase-1 entities take precedence).
export function buildNameIndex(entityMap) {
  const index = new Map();
  for (const e of entityMap.values()) {
    for (const key of [normalizeKey(e.name), normalizeKey(e.slug)]) {
      if (key && !index.has(key)) index.set(key, e);
    }
  }
  return index;
}

// Resolve a registry-table name to an existing entity, falling back to an
// unambiguous word-boundary prefix match ("Redline" → "Redline Facilitation
// Group") when there's no exact name/slug hit. Informal tables (forum
// handles, breach registries) often refer to an entity by its short name
// while its formal defining doc uses the full name — without this, the two
// forms silently mint two separate entity nodes for the same real org. Only
// resolves when exactly one entity matches, so a generic short name can't
// misfire onto an unrelated longer one.
// Mint the fallback entity for a party the atlas names in prose but that no
// other pattern defined ("VoteWizard", "Spark Assets Foundation"). The kind is
// inferred from the name alone, so the caller's `source` tag is the only record
// of which pattern minted it. Registers the entity in the caller's name index
// so a second mention resolves instead of minting a duplicate.
export function createProseParty(addEntity, nameIndex, name, source, sourceDoc) {
  const et = /\bFoundation$/i.test(name) ? "foundation" : "ecosystem_actor";
  const created = addEntity(slugify(name), name, et, null, null, {
    source,
    source_doc_no: sourceDoc.doc_no,
  });
  nameIndex.set(normalizeKey(name), created);
  return created;
}

export function resolveAliasedEntity(nameIndex, entityMap, name) {
  const exact = nameIndex.get(normalizeKey(name));
  if (exact) return exact;
  const prefix = `${name.toLowerCase()} `;
  const candidates = [...entityMap.values()].filter((e) => e.name.toLowerCase().startsWith(prefix));
  return candidates.length === 1 ? candidates[0] : null;
}

// ---------------------------------------------------------------------------
// Content extraction helpers
// ---------------------------------------------------------------------------

// Content readers live in their own module; re-exported for the same reason.
export { extractAssignment, parseNameList, extractListItems } from "./graph-patterns-content.ts";

// doc_no navigation (ancestor stripping, annotation targets, primitive roots)
// lives in its own module; re-exported for the same reason.
export { ancestorByStripping, annotationTarget, primitiveRootFor } from "./graph-patterns-docno.ts";
