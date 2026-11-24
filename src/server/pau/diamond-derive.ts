// Names for rate-limit keys, by controller generation. A monolithic key is
// derived from the LIMIT_* constants of the monolithic controllers
// (key-derive.ts). A diamond's facets run their own code, so a diamond key is
// derived only from the shapes the facets it integrates prove (facet-source.ts,
// read from the Controller's replayed IntegrationSet), never from the
// monolithic constants and never from a facet the diamond does not run. Their
// arguments come from the candidate addresses, the diamond's own parameter
// events, and what the facet itself reads on chain (facet-keys.ts HOOKS); a
// two-address key's, in either generation, only from pairs that belong
// together (key-context.ts).
import chainRegistry from "../../data/chain-registry.json";
import type { DerivedKey, PauParam, PauSnapshot, RetiredAddress } from "../../lib/pau.ts";
import { DIAMOND_INPUTS, settledFirst, settledKeys, unsettled } from "./key-memo.ts";
import { candidateAddresses, deriveKeys, type KeyShape } from "./key-derive.ts";
import { contextPairs, snapshotAddresses } from "./key-context.ts";
import { monolithicNamer } from "./mono-namer.ts";
import { withRetiredKeys } from "./retired-addresses.ts";
import { cachedSourceMaterial, mergeMaterial, type SourceMaterial } from "./source-material.ts";
import { facetNameAt, facetShapesAt, type FacetShape } from "./facet-source.ts";
import { facetKeyRule, HOOKS, type FacetHook } from "./facet-keys.ts";
import { withDerivedKeys, type ChainReader } from "./snapshot.ts";

/** Adds what can be named to a snapshot's rate-limit keys; `prev` is the deployment's stored snapshot, whose settled keys are reused. */
export type KeyNamer = ((snap: PauSnapshot, read: ChainReader, prev?: PauSnapshot) => Promise<PauSnapshot>) & {
  /** Every key the refresh may ask about, so the scan the monolithic deployments share runs once for all of them. */
  prepare?: (keys: string[]) => void;
};

/** Role → address, for one subject a hook read. */
type Bound = Record<string, string>;

const ADDRESS_RE = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g;
const params = (snap: PauSnapshot): PauParam[] => snap.contracts.flatMap((c) => c.params ?? []);

/** The facets a diamond's Controller integrates now, by their IntegrationSet config. */
export function integratedFacets(snap: PauSnapshot): string[] {
  const facets = snap.contracts.flatMap((c) => c.integrations ?? []).map((i) => (i.config as { facet?: unknown } | null)?.facet);
  return [...new Set(facets.filter((f): f is string => typeof f === "string").map((f) => f.toLowerCase()))];
}

/** One hook's subjects, each with the values the facet reads from it; a failed read leaves its role out. */
async function hookBound(snap: PauSnapshot, read: ChainReader, h: FacetHook): Promise<Bound[]> {
  const subjects = [...new Set(params(snap).filter((p) => p.event === h.event).map((p) => String(p.args[h.arg] ?? "").toLowerCase()))].filter((a) => /^0x[0-9a-f]{40}$/.test(a));
  const res = await read(snap.chain, subjects.flatMap((address) => h.reads.map((r) => ({ address, functionName: r.fn, args: [] }))));
  return subjects.map((s, i) => {
    const got = h.reads.flatMap((r, j) => (typeof res[i * h.reads.length + j] === "string" ? [[r.role, (res[i * h.reads.length + j] as string).toLowerCase()]] : []));
    return Object.fromEntries([[h.role, s], ...got]);
  });
}

function keyShape(s: FacetShape, bound: Bound[]): KeyShape {
  const via = facetKeyRule(s)?.via;
  const tuples = s.roles.length ? bound.filter((b) => s.roles.every((r) => b[r])).map((b) => s.roles.map((r) => b[r])) : [];
  const name = (args: string[]) => ({ constant: s.constant, args, roles: s.roles, facet: s.facet, getter: s.getter, ...(via ? { via: args[s.roles.indexOf(via)] } : {}) });
  return { constant: s.constant, types: s.types, tuples, name };
}

export interface DiamondSources {
  addresses: string[];
  /** Ordered address pairs a two-address shape is hashed with (key-context.ts). */
  pairs?: string[][];
  /** The key shapes of the facet at an address on a chain; none when its source is not cached. */
  shapesOf: (chain: string, facet: string) => FacetShape[];
  /** A derivation an earlier snapshot settled (key-memo.ts), used before hashing; undefined to hash. */
  settled?: (key: string) => DerivedKey | null | undefined;
}

/**
 * A diamond snapshot with each key a facet it integrates derives named. With
 * no shape to hash (no cached or parsable facet source), what an earlier
 * snapshot settled still names its keys, so a missing source never blanks them.
 */
export async function withDiamondKeys(snap: PauSnapshot, read: ChainReader, src: DiamondSources): Promise<PauSnapshot> {
  const shapes = integratedFacets(snap).flatMap((f) => src.shapesOf(snap.chain, f));
  const bound = new Map<string, Bound[]>();
  for (const h of HOOKS.filter((x) => shapes.some((s) => s.facet === x.facet))) bound.set(h.facet, [...(bound.get(h.facet) ?? []), ...(await hookBound(snap, read, h))]);
  const own = JSON.stringify(params(snap)).match(ADDRESS_RE) ?? [];
  const keyShapes = shapes.map((s) => keyShape(s, bound.get(s.facet) ?? []));
  const found = deriveKeys(keyShapes, { addresses: [...src.addresses, ...own], words: [], pairs: src.pairs }, unsettled(snap, src.settled));
  return withDerivedKeys(snap, settledFirst(src.settled, (key) => found.get(key.toLowerCase()) ?? null));
}

const CHAIN_ID = new Map(chainRegistry.chains.map((c) => [c.chain, c.chainId]));

/** The key shapes of each facet's cached source; a source the parser refuses gives none, warned once. */
function facetShapes(dir: string): DiamondSources["shapesOf"] {
  const unparsed = new Set<string>();
  return (chain, facet) => {
    try {
      return CHAIN_ID.has(chain) ? facetShapesAt(dir, CHAIN_ID.get(chain)!, facet) : [];
    } catch (e) {
      if (!unparsed.has(facet)) console.warn(`pau: facet ${facet} on ${chain} not parsed, its keys stay unnamed: ${(e as Error).message}`);
      unparsed.add(facet);
      return [];
    }
  };
}

/** Where the namer reads its sources, and what the worker adds to its candidates. */
export interface NamerSources {
  /** The explorer cache: facet sources, monolithic ABIs and verified sources. */
  dir?: string;
  /** The addresses the atlas has retired (retired-addresses.ts), read once, when first needed. */
  retired?: () => Map<string, RetiredAddress>;
  /** The naming material of sources not in `dir`: the spells behind stored changes (spell-sources.ts). */
  material?: SourceMaterial;
  /** The addresses the atlas states for each prime (key-context.ts), read once, when first needed. */
  context?: () => Promise<Map<string, string[]>>;
}

/**
 * The worker's namer: each generation's deriver, over the address artifacts,
 * the registry's addresses, the naming material of the sources cached in
 * `dir` and of `material` (source-material.ts: their LIMIT_* names,
 * address constants and bytes32 constants), and the addresses the atlas has
 * retired, with the facet sources and monolithic ABIs cached in `dir`. A
 * two-address key is hashed only with its deployment's context pairs
 * (key-context.ts). A key derived from a retired address is marked so
 * (retired-addresses.ts). The candidates and the shared monolithic scan are
 * built once, and what the deployment's previous snapshot settled is reused
 * (key-memo.ts). A diamond reuses only a derivation from a facet it still
 * integrates. A facet whose source the parser refuses names none of its keys,
 * rather than guessing or stopping the diamond's snapshot.
 */
export function keyNamer(addressFiles: string[], extra: unknown, { dir = ".cache/etherscan", ...sources }: NamerSources = {}): KeyNamer {
  let addresses: string[] | undefined;
  let retired: Map<string, RetiredAddress> | undefined;
  let material: SourceMaterial | undefined;
  let primes: Promise<Map<string, string[]>> | undefined;
  const gone = () => (retired ??= sources.retired?.() ?? new Map());
  const sourced = () => (material ??= mergeMaterial([cachedSourceMaterial(dir), ...(sources.material ? [sources.material] : [])]));
  const all = () => (addresses ??= [...candidateAddresses(addressFiles, extra), ...sourced().addresses, ...gone().keys()]);
  // A context that cannot be read leaves two-address keys to the snapshot's and the spells' pairs, rather than failing every deployment.
  const stated = async (prime: string) => (await (primes ??= (sources.context?.() ?? Promise.resolve(new Map())).catch(() => new Map()))).get(prime) ?? [];
  const mono = monolithicNamer(dir, sourced, all);
  const shapesOf = facetShapes(dir);
  const namer: KeyNamer = async (snap, read, prev) => {
    const pairs = contextPairs([...(await stated(snap.prime)), ...snapshotAddresses(snap)], sourced().pairs);
    const named = snap.kind === "diamond" ? await diamondNamed(snap, read, prev, { addresses: all(), pairs, shapesOf }, integratedNames(dir, snap)) : mono.name(snap, prev, pairs);
    return withRetiredKeys(named, gone());
  };
  namer.prepare = mono.prepare;
  return namer;
}

// A derivation records its facet's contract name, so the integrated facets are named the same way.
const integratedNames = (dir: string, snap: PauSnapshot) =>
  new Set(integratedFacets(snap).flatMap((f) => (CHAIN_ID.has(snap.chain) ? [facetNameAt(dir, CHAIN_ID.get(snap.chain)!, f)?.toLowerCase() ?? ""] : [])).filter(Boolean));

/** A diamond reuses only a derivation from a facet it still integrates, and never a miss. */
async function diamondNamed(snap: PauSnapshot, read: ChainReader, prev: PauSnapshot | undefined, src: DiamondSources, names: Set<string>): Promise<PauSnapshot> {
  const settled = settledKeys(prev, DIAMOND_INPUTS, (d) => !!d.facet && names.has(d.facet.toLowerCase()));
  return { ...(await withDiamondKeys(snap, read, { ...src, settled })), keysNamedWith: DIAMOND_INPUTS };
}
