/**
 * Shared regexes for pattern-driven graph extraction: UUID links, accord
 * parties, org-to-org prose and the bullet-field factory. Re-exported by
 * graph-patterns.mjs, the one entry point importers use.
 */

// Canonical UUID source fragment. Exported as a *source string* so callers that
// embed a UUID inside a larger pattern (doc-edges' IMPLEMENTS_RE) compose it
// instead of retyping the five hex groups.
export const UUID_SRC = String.raw`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`;
export const UUID_LINK_RE = new RegExp(String.raw`\[([^\]]*)\]\((${UUID_SRC})\)`, "gi");
// A markdown link's URL — "[text](https://…)". Used by table-parser's
// extractUrl (Active Data cells) and by the omni Discord edge (Pattern 22).
export const MD_URL_RE = /\((https?:\/\/[^)]+)\)/;
export const COMPRISES_RE = /The party ['‘]([^'’]+)['’] comprises\s+(.+?)\./i;
// Atomic parties use a different sentence shape — "The party 'X' is <descriptor>."
// (e.g. A.2.8.2.2.1.1.4 Moonbow: "…is the entity owning relevant intellectual
// property."). The party still signs the accord, it just has no members to list.
export const ATOMIC_PARTY_RE = /The party ['‘]([^'’]+)['’]\s+is\b/i;

// Org-to-org prose (Pattern 20): the same two sentence shapes are read by two
// consumers — graph-entity-edges.mjs's free-content scan (Phase 2w, emits
// prime_foundation_of/provides_services_to edges) and graph-entities.mjs's
// title-anchored Foundation/Development Company doc read (Phase 1p, creates/
// corrects the entities those edges need). Shared here so the two cannot drift
// apart: the leading-article strip lives in `cleanOrgProseName` below, once.
// `g` flag: both consumers reset `lastIndex` before use, whether via
// `matchAll` (2w) or a single `exec` (1p).
// Either name may carry a parenthetical aside, as next-gen-atlas PR 370 writes
// Grove's development company doc (A.6.1.1.2.2.1.1.3.1.1.5: "Grove Labs (…) is
// a development company …"). The aside is matched but not captured: the name
// before it is the entity's name, and both consumers read the two names as
// m[1] and m[2].
const NAME = String.raw`([A-Z][A-Za-z0-9'&. -]+?)(?: \([^()]*\))?`;
//   "The Spark Foundation is the Prime Foundation associated with Spark."
//   "Rubicon is the Prime Foundation associated with Obex."
export const PRIME_FOUNDATION_RE = new RegExp(String.raw`\b${NAME} is the Prime Foundation associated with (?:the )?${NAME}[.,]`, "g");
//   "Phoenix Labs is a development company that provides services to the Spark Foundation."
//   "Treadstone is the development company that provides services to Rubicon." (A.6.1.1.5.2.1.1.3.1.1.6 — "is THE ... company")
export const PROVIDES_SERVICES_RE = new RegExp(String.raw`\b${NAME} is (?:an?|the) [a-z -]*company that provides services to (?:the )?${NAME}[.,]`, "g");
// A leading article survives the capture ("The Spark Foundation" — the regex
// can't tell "The" apart from a real name word) and is stripped here instead,
// so both consumers clean a captured name identically.
export const cleanOrgProseName = (raw: string) => raw.trim().replace(/^the\s+/i, "");

// The atlas writes structured fields as bullet key/value lines:
//   "- Recipient: Sky Frontier Foundation"
//   "- Soter Labs: 2 signers"
// Both halves are REGEX SOURCE, not literals — the factory escapes nothing, so
// a label may itself capture ("(.+?)\\s+amount"). Returns a fresh RegExp per
// call: callers hold these as module consts and reset `lastIndex` on the /g
// ones, which a shared object would break.
export function bulletField(labelSrc: string, valueSrc: string, flags = "im") {
  return new RegExp(String.raw`^[-*]\s*${labelSrc}:\s*${valueSrc}\s*$`, flags);
}
