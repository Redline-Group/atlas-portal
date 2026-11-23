/**
 * Atlas-side PAU discovery: turns the address docs under each Prime agent's
 * "ALM Contracts" / "Diamond PAU Contracts" / "Multisigs" sections, under each
 * Halo agent's "NFAT Facilities" (the NFAT Facility Contract and the Diamond
 * PAU the halo runs it through), and the Allocation System primitive's "Shared
 * Contracts", into observations of (owner, chain, controller generation, role,
 * address). It only proposes;
 * src/data/pau-registry.json stays the curated source of truth.
 *
 * Every signal is structural and read fresh from the atlas, never a stored
 * doc_no:
 *   - the owner is the ancestor whose UUID is a prime or halo entity's
 *     defining doc;
 *   - ancestors come from doc_no arithmetic (buildAncestors), because parentId
 *     skips levels past heading depth 6;
 *   - the generation is "diamond" under any section titled "...Diamond...",
 *     and for every halo contract: an NFAT Facility is run through a Diamond PAU;
 *   - a document listing several contracts ("- ALM Proxy: `0x…`") yields one
 *     observation per line, its role read from the line's label;
 *   - the chain is the nearest title naming a known chain (chainFromLabel,
 *     the same title matcher build-index uses, so "Gnosis Safe" is not the
 *     gnosis chain), falling back to the address's atlas chain. The doc's own placement outranks
 *     addresses.json, which attributes some PAU addresses to the wrong chain
 *     when the same address exists on two chains.
 */
import { buildAncestors } from "../../src/lib/atlasHelpers.ts";
import type { AtlasNode } from "../../src/types.ts";
import type { PauKind, PauRole } from "../../src/lib/pauRegistry.ts";
import { chainFromLabel } from "./address-chains.mjs";

export interface PauObservation {
  /** Entity UUID of the Prime, or of the Halo running an NFAT Facility; null for contracts shared by every diamond PAU. */
  prime: string | null;
  chain: string;
  chainFrom: "title" | "address";
  /** null for a prime's governance multisigs, which serve every generation. */
  kind: PauKind | null;
  role: PauRole;
  address: string;
  doc: string;
  docNo: string;
  title: string;
}

export interface DiscoverInput {
  docs: Record<string, AtlasNode>;
  /** Prime entity UUID → name. A prime entity's UUID is its defining doc's UUID. */
  primes: Map<string, string>;
  /** Halo entity UUID → name: the agents that run NFAT Facilities. */
  halos?: Map<string, string>;
  /** Atlas chain per address (public/addresses.atlas.json). */
  atlasChain: (address: string) => string | undefined;
}

// Ordered: the first match wins, so "ALM Rate Limits" is never read as a
// controller and "ALM Relayer Multisig" never as a proxy.
const ROLE_RULES: [RegExp, PauRole][] = [
  [/\bNFAT Facility Contract\b/i, "nfatFacility"],
  [/\bRelayer\b/i, "relayer"],
  [/\bFreezer\b/i, "freezer"],
  [/\bFacet\b/i, "facet"],
  [/\bAccessControls\b/i, "accessControls"],
  [/\bAdministeredAgent\b/i, "administeredAgent"],
  [/\bBeacon\b/i, "beacon"],
  [/\bBeamState\b/i, "beamState"],
  [/^Configurator$/i, "configurator"],
  [/\bRate ?Limits\b/i, "rateLimits"],
  [/\bALM Proxy\b/i, "almProxy"],
  [/\bController\b(?!['’]s)/i, "controller"],
];

// The section that anchors an address list: a prime's "ALM Contracts" /
// "Diamond PAU Contracts" / "Multisigs", or the primitive's "Shared
// Contracts". Role-hierarchy and instance docs also carry addresses, but mix
// several roles in one doc. Chain and generation are read only from the anchor
// down, so an unrelated ancestor ("Base Elements") never names a chain.
const PRIME_SECTION_RE = /\b(?:ALM|PAU) Contracts\b|\bMultisigs\b/i;
const HALO_SECTION_RE = /\bNFAT Facilities$/i;
const SHARED_SECTION_RE = /\bShared Contracts\b/i;
const DIAMOND_RE = /\bDiamond\b/i;
/** Chain of a governance multisig no title places: it serves every chain of its prime. */
export const ANY_CHAIN = "*";
const EVM_RE = /^0x[0-9a-f]{40}$/;
// A leaf titled just "Address" names its role in its parent's title.
const BARE_LEAF_RE = /^(?:State )?Address(?:es)?$/i;
// "- ALM Proxy: `0x…`" or "- `RateLimits`: `0x…`": a label and its one address.
const LABELLED_LINE_RE = /^\s*[-*]\s+`?([^`:\n]+?)`?\s*:\s*`(0x[0-9a-fA-F]{40})`/gm;

export function roleOf(title: string): PauRole | null {
  return ROLE_RULES.find(([re]) => re.test(title))?.[1] ?? null;
}

function chainOf(titles: string[], address: string, input: DiscoverInput) {
  for (const t of [...titles].reverse()) {
    const chain = chainFromLabel(t);
    if (chain) return { chain, chainFrom: "title" as const };
  }
  const chain = input.atlasChain(address);
  return chain ? { chain, chainFrom: "address" as const } : null;
}

/** The anchor section and everything below it, or null when the doc is not in one. */
function anchoredSections(doc: AtlasNode, input: DiscoverInput, docNoToId: Map<string, string>) {
  const ancestors = buildAncestors(input.docs, docNoToId, doc.id);
  const pi = ancestors.findIndex((a) => input.primes.has(a.id) || input.halos?.has(a.id));
  const prime = pi >= 0 ? ancestors[pi].id : null;
  const halo = !!prime && !input.primes.has(prime);
  const titles = ancestors.map((a) => a.title);
  const section = halo ? HALO_SECTION_RE : prime ? PRIME_SECTION_RE : SHARED_SECTION_RE;
  const anchor = titles.findIndex((t, i) => i > pi && section.test(t));
  return anchor < 0 ? null : { prime, halo, sections: titles.slice(anchor) };
}

/** Diamond under a "Diamond" section; a multisig listed outside the ALM sections serves both. */
function kindOf(prime: string | null, halo: boolean, role: PauRole, sections: string[]): PauKind | null {
  if (!prime || halo || sections.some((t) => DIAMOND_RE.test(t))) return "diamond";
  const multisig = role === "relayer" || role === "freezer";
  return multisig && !sections.some((t) => /\bALM\b/i.test(t)) ? null : "monolithic";
}

/** The contracts a document names, each with its role: one role from its title, else one per labelled line. */
function namedContracts(doc: AtlasNode, sections: string[]): { role: PauRole; address: string; title: string }[] {
  const role = roleOf(BARE_LEAF_RE.test(doc.title.trim()) ? sections.at(-1) ?? "" : doc.title);
  if (role) return doc.addressRefs.map((address) => ({ role, address, title: doc.title }));
  return [...(doc.content ?? "").matchAll(LABELLED_LINE_RE)].flatMap((m) => {
    const lineRole = roleOf(m[1]);
    return lineRole ? [{ role: lineRole, address: m[2].toLowerCase(), title: `${doc.title} / ${m[1].trim()}` }] : [];
  });
}

function observeDoc(doc: AtlasNode, input: DiscoverInput, docNoToId: Map<string, string>): PauObservation[] {
  const anchored = anchoredSections(doc, input, docNoToId);
  if (!anchored) return [];
  const { prime, halo, sections } = anchored;
  const out: PauObservation[] = [];
  for (const { role, address, title } of namedContracts(doc, sections)) {
    if (!EVM_RE.test(address) || (!prime && role !== "facet" && role !== "beacon")) continue;
    const kind = kindOf(prime, halo, role, sections);
    let where = chainOf([...sections, doc.title], address, input);
    if (!where) continue;
    if (kind === null && where.chainFrom === "address") where = { chain: ANY_CHAIN, chainFrom: "address" };
    out.push({ prime, ...where, kind, role, address, doc: doc.id, docNo: doc.doc_no, title });
  }
  return out;
}

/** Every PAU observation in the atlas, in doc order. */
export function discoverPau(input: DiscoverInput): PauObservation[] {
  const docNoToId = new Map(Object.values(input.docs).map((d) => [d.doc_no, d.id]));
  return Object.values(input.docs)
    .filter((d) => d.addressRefs?.length)
    .sort((a, b) => a.order - b.order)
    .flatMap((d) => observeDoc(d, input, docNoToId));
}
