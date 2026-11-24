// Names for rate-limit keys the atlas never writes out as a hash. A controller
// derives each key from one of its LIMIT_* constants (keccak256 of the name),
// alone or abi-encoded with what it limits: an asset or pool address, a CCTP
// domain or LayerZero endpoint id, or an (asset, destination) pair. Hashing
// each constant with its candidate arguments recovers the name and arguments.
// The hashing engine (deriveKeys) also hashes the diamond facets' shapes
// (diamond-derive.ts); the monolithic shapes are declared here.
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
  /** An argument may be one the prime never states (a transfer's asset or destination), so the candidates' `cross` lists are tried too. */
  outward?: true;
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
  /** Ordered address pairs that belong together (key-tiers.ts). */
  pairs?: string[][];
  /** Two lists an `outward` shape takes one argument from each of, in either order, without building the pairs (key-tiers.ts). */
  cross?: [string[], string[]];
}

/** An argument as named and as abi-encoded, so each candidate is encoded once, not once per hash. */
type Arg = readonly [value: string, encoded: string];
const arg = (t: ArgType, v: string): Arg => [v, word(t, v)];
const ID_ARGS = IDS.map((i) => arg("uint", i));

interface Encoded {
  addresses: Arg[];
  words: Arg[];
  pairs: Arg[][];
  cross: [Arg[], Arg[]];
}

const lower = (xs: string[]) => [...new Set(xs.map((x) => x.toLowerCase()))];

function encode(c: Candidates): Encoded {
  return {
    addresses: lower(c.addresses).map((a) => arg("address", a)),
    words: lower(c.words).map((w) => arg("bytes32", w)),
    pairs: (c.pairs ?? []).filter((p) => p.length === 2).map((p) => p.map((a) => arg("address", a.toLowerCase()))),
    cross: [lower(c.cross?.[0] ?? []).map((a) => arg("address", a)), lower(c.cross?.[1] ?? []).map((a) => arg("address", a))],
  };
}

const slots = (s: KeyShape, c: Encoded) => s.types.map((t) => (t === "address" ? c.addresses : ID_ARGS));

function* product(slots: Arg[][], prefix: Arg[] = []): Generator<Arg[]> {
  if (!slots.length) {
    yield prefix;
    return;
  }
  for (const v of slots[0]) yield* product(slots.slice(1), [...prefix, v]);
}

function* argLists(s: KeyShape, c: Encoded): Generator<Arg[]> {
  for (const t of s.tuples ?? []) yield t.map((v, i) => arg(s.types[i], v));
  if (enumerable(s.types)) yield* product(slots(s, c));
  if (pairShape(s.types)) {
    yield* c.pairs;
    if (s.outward) for (const a of c.cross[0]) for (const b of c.cross[1]) yield* [[a, b], [b, a]];
  }
  if (oneWord(s.types)) for (const w of c.words) yield [w];
}

const cost = (s: KeyShape, c: Encoded) =>
  (s.tuples?.length ?? 0) +
  (enumerable(s.types) ? slots(s, c).reduce((n, xs) => n * xs.length, 1) : 0) +
  (pairShape(s.types) ? c.pairs.length + (s.outward ? 2 * c.cross[0].length * c.cross[1].length : 0) : 0) +
  (oneWord(s.types) ? c.words.length : 0);

/**
 * The derivation of each wanted key that `shapes` reproduce, hashing the
 * cheapest shapes first and stopping once every key is found. Only matches are
 * kept, so memory follows the keys asked about, not the candidates tried.
 */
export function deriveKeys(shapes: KeyShape[], candidates: Candidates, keys: Iterable<string>): Map<string, DerivedKey> {
  const wanted = new Set(lower([...keys]));
  const found = new Map<string, DerivedKey>();
  if (!wanted.size) return found;
  const c = encode(candidates);
  for (const s of [...shapes].sort((a, b) => cost(a, c) - cost(b, c))) {
    const base = keccak256(toHex(s.constant));
    for (const args of argLists(s, c)) {
      const key = args.length ? keccak256(`${base}${args.length === 1 ? args[0][1] : args.map((a) => a[1]).join("")}` as Hex) : base;
      if (!wanted.has(key) || found.has(key)) continue;
      found.set(key, s.name(args.map((a) => a[0])));
      if (found.size === wanted.size) return found;
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
  const pair = (outward?: true): KeyShape => ({ constant, types: ["address", "address"], name: (args) => ({ constant, args, via: args[1] }), ...(outward ? { outward } : {}) });
  // A transfer may move any asset to any destination; a Uniswap V3 pool is an integration the prime states.
  if (constant === "LIMIT_ASSET_TRANSFER") shapes.push(pair(true));
  if (/^LIMIT_UNISWAP_V3_\w+$/.test(constant)) shapes.push(pair());
  if (/^LIMIT_(LAYERZERO|CENTRIFUGE)_TRANSFER$/.test(constant)) shapes.push(plain(["address", "uint"]));
  return shapes;
}

/** Whether a shape is hashed only from context pairs, so its search follows the deployment rather than the candidates every deployment shares. */
export const isPairShape = (s: KeyShape) => pairShape(s.types);
