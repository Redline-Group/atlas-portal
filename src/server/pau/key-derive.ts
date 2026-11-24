// Names for rate-limit keys the atlas never writes out as a hash. A controller
// derives each key from one of its LIMIT_* constants (keccak256 of the name),
// alone or abi-encoded with what it limits: an asset or pool address, a CCTP
// domain or LayerZero endpoint id, or an (asset, destination) pair. Hashing
// each constant with its candidate arguments recovers the name and arguments.
// The hashing engine (deriveKeys) also hashes the diamond facets' shapes
// (diamond-derive.ts); the monolithic shapes are declared here.
import fs from "node:fs";
import path from "node:path";
import { keccak256, toHex, type Hex } from "viem";
import type { DerivedKey } from "../../lib/pau.ts";

/** How one argument is abi-encoded: an address, an unsigned integer (a CCTP domain, an endpoint id), or a bytes32. */
export type ArgType = "address" | "uint" | "bytes32";

/**
 * One way a key is encoded: keccak256(abi.encode(keccak256(constant), ...args)).
 * `tuples` are argument lists to hash as given (values read from the chain);
 * besides them, a shape with at most one address (and at most two arguments)
 * is enumerated over the candidate addresses and IDS, a shape of two addresses
 * only over the candidate pairs, and a shape of one bytes32 over the candidate
 * words (a Uniswap v4 pool id).
 */
export interface KeyShape {
  constant: string;
  types: ArgType[];
  name: (args: string[]) => DerivedKey;
  tuples?: string[][];
}

/** CCTP domains, Centrifuge ids and LayerZero v2 endpoint ids (30101 Ethereum onward). */
const IDS = [...Array.from({ length: 32 }, (_, i) => i), ...Array.from({ length: 321 }, (_, i) => 30100 + i)].map(String);

// Every abi.encode argument is one 32-byte word, so a uint16 and a uint32 encode alike.
const word = (t: ArgType, v: string) => (t === "uint" ? BigInt(v).toString(16) : v.slice(2).toLowerCase()).padStart(64, "0");

const addressCount = (types: ArgType[]) => types.filter((t) => t === "address").length;
// Every address against every other is a million hashes per shape in one loop the
// worker's hard-cap timer cannot interrupt, so two addresses come only from pairs that belong together.
const enumerable = (types: ArgType[]) => types.length <= 2 && !types.includes("bytes32") && addressCount(types) <= 1;
const pairShape = (types: ArgType[]) => types.length === 2 && addressCount(types) === 2;
const oneWord = (types: ArgType[]) => types.length === 1 && types[0] === "bytes32";

/** The candidates the deriver draws arguments from. */
export interface Candidates {
  addresses: string[];
  words: string[];
  /** Ordered address pairs that belong together (key-context.ts). */
  pairs?: string[][];
}

function* product(slots: string[][], prefix: string[] = []): Generator<string[]> {
  if (!slots.length) {
    yield prefix;
    return;
  }
  for (const v of slots[0]) yield* product(slots.slice(1), [...prefix, v]);
}

function* argLists(s: KeyShape, c: Required<Candidates>): Generator<string[]> {
  yield* s.tuples ?? [];
  if (enumerable(s.types)) yield* product(s.types.map((t) => (t === "address" ? c.addresses : IDS)));
  if (pairShape(s.types)) yield* c.pairs;
  if (oneWord(s.types)) for (const w of c.words) yield [w];
}

const cost = (s: KeyShape, c: Required<Candidates>) =>
  (s.tuples?.length ?? 0) +
  (enumerable(s.types) ? s.types.reduce((p, t) => p * (t === "address" ? c.addresses.length : IDS.length), 1) : 0) +
  (pairShape(s.types) ? c.pairs.length : 0) +
  (oneWord(s.types) ? c.words.length : 0);

const lower = (xs: string[]) => [...new Set(xs.map((x) => x.toLowerCase()))];

/**
 * The derivation of each wanted key that `shapes` reproduce, hashing the
 * cheapest shapes first and stopping once every key is found. Only matches are
 * kept, so memory follows the keys asked about, not the candidates tried.
 */
export function deriveKeys(shapes: KeyShape[], candidates: Candidates, keys: Iterable<string>): Map<string, DerivedKey> {
  const pairs = (candidates.pairs ?? []).map((p) => p.map((a) => a.toLowerCase())).filter((p) => p.length === 2);
  const c = { addresses: lower(candidates.addresses), words: lower(candidates.words), pairs };
  const wanted = new Set(lower([...keys]));
  const found = new Map<string, DerivedKey>();
  for (const s of [...shapes].sort((a, b) => cost(a, c) - cost(b, c))) {
    if (found.size === wanted.size) break;
    const base = keccak256(toHex(s.constant));
    for (const args of argLists(s, c)) {
      const key = s.types.length ? keccak256(`${base}${s.types.map((t, i) => word(t, args[i])).join("")}` as Hex) : base;
      if (wanted.has(key) && !found.has(key)) found.set(key, s.name(args));
    }
  }
  return found;
}

/**
 * The monolithic controllers' shapes: every constant bare, with one address,
 * with one id and with one word (UniswapV4Lib's pool id); makeAssetDestinationKey pairs, identified by the second
 * argument, for an asset transfer (asset, destination) and for UniswapV3Lib
 * (token, pool); and (address, id) for LayerZero and Centrifuge transfers.
 */
export function monolithicShapes(constant: string): KeyShape[] {
  const plain = (types: ArgType[]): KeyShape => ({ constant, types, name: (args) => ({ constant, args }) });
  const shapes = [plain([]), plain(["address"]), plain(["uint"]), plain(["bytes32"])];
  if (/^LIMIT_(ASSET_TRANSFER|UNISWAP_V3_\w+)$/.test(constant)) shapes.push({ constant, types: ["address", "address"], name: (args) => ({ constant, args, via: args[1] }) });
  if (/^LIMIT_(LAYERZERO|CENTRIFUGE)_TRANSFER$/.test(constant)) shapes.push(plain(["address", "uint"]));
  return shapes;
}

/** Whether a shape is hashed only from context pairs, so its search follows the deployment rather than the candidates every deployment shares. */
export const isPairShape = (s: KeyShape) => pairShape(s.types);

type AbiItem = { type?: string; name?: string; inputs?: unknown[] };

/** Every entry of the explorer cache in `dir` (`<chainId>/<address>.json`); an unreadable or truncated file is left out. */
export function cachedEntries(dir: string): Record<string, unknown>[] {
  const files = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).flatMap((chain) => fs.readdirSync(path.join(dir, chain)).map((f) => path.join(dir, chain, f)));
  return files.flatMap((f) => {
    try {
      return [JSON.parse(fs.readFileSync(f, "utf8")) as Record<string, unknown>];
    } catch {
      return [];
    }
  });
}

/** A cached explorer entry's ABI; an unparsable one reads as none. */
function abiOf(entry: Record<string, unknown>): AbiItem[] {
  try {
    const abi = typeof entry.abi === "string" ? JSON.parse(entry.abi) : entry.abi;
    return Array.isArray(abi) ? abi : [];
  } catch {
    return [];
  }
}

/** Every zero-argument LIMIT_* view in the cached contract ABIs. */
export function limitConstants(dir = ".cache/etherscan"): string[] {
  const names = new Set<string>();
  for (const x of cachedEntries(dir).flatMap(abiOf)) if (x.type === "function" && /^LIMIT_/.test(x.name ?? "") && !x.inputs?.length) names.add(x.name!);
  return [...names].sort();
}

const ADDRESS_RE = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g;

/** An address artifact's addresses: addresses.json is keyed by address, addresses.atlas.json nests them under `addresses`. */
const addressKeys = (j: { addresses?: unknown }) => Object.keys(j.addresses && typeof j.addresses === "object" ? j.addresses : j);

/** Addresses the keys may be derived from: every one in the address artifacts that exist, plus the given extras. */
export function candidateAddresses(files: string[], extra: unknown): string[] {
  const out = new Set<string>();
  for (const f of files.filter((x) => fs.existsSync(x))) for (const a of addressKeys(JSON.parse(fs.readFileSync(f, "utf8")))) out.add(a);
  for (const m of JSON.stringify(extra).matchAll(ADDRESS_RE)) out.add(m[0]);
  return [...out].filter((a) => /^0x[0-9a-fA-F]{40}$/.test(a));
}
