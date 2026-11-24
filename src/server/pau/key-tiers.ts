// The tiers a deployment's two-address keys are searched in, nearest first.
// Each tier runs only for the keys the tiers before it left, and keeps only
// matches (deriveKeys):
//   1. pairs within one of the prime's instances, within the deployment's own
//      addresses, and the pairs spells pass in one argument list;
//   2. pairs anywhere in the prime's artifact or the deployment's own addresses;
//   3. for an asset transfer only (KeyShape `outward`), one argument from those
//      and the other from every candidate address: the one key whose asset or
//      destination the prime need not state. Only a monolithic deployment
//      reaches it: its misses are kept between rebuilds (key-memo.ts), a
//      diamond's are not, so a diamond would pay it hourly.
// Every tier pairs an address with itself too, as a transfer of a token to its
// own contract does.
import type { DerivedKey } from "../../lib/pau.ts";
import { EVM_ADDRESS_BODY_SRC } from "../../lib/patterns.ts";
import type { KeyContext } from "./key-context.ts";
import { deriveKeys, isPairShape, type Candidates, type KeyShape } from "./key-derive.ts";

const PAIR_RE = new RegExp(`^${EVM_ADDRESS_BODY_SRC},${EVM_ADDRESS_BODY_SRC}$`);
type PairSource = Pick<Candidates, "pairs" | "cross">;

/** Every ordered pair of `xs`, each address with itself included. */
function allPairs(xs: string[]): string[][] {
  const u = [...new Set(xs.map((a) => a.toLowerCase()))];
  return u.flatMap((a) => u.map((b) => [a, b]));
}

/** Spells' `a,b` pairs that are well formed; they are stored material, so a bad row is dropped, not hashed. */
const statedPairs = (stated: string[]) => stated.map((p) => p.toLowerCase()).filter((p) => PAIR_RE.test(p)).map((p) => p.split(","));

/** The addresses the deployment's prime states (its instances' included) and its own, together. */
export const primeAndOwn = (c: KeyContext) => [...c.prime, ...c.instances.flat(), ...c.own];

export const nearTier = (c: KeyContext): PairSource => ({ pairs: [...[...c.instances, c.own].flatMap(allPairs), ...statedPairs(c.stated)] });
export const primeTier = (c: KeyContext): PairSource => ({ pairs: allPairs(primeAndOwn(c)) });
/** One side the prime's and own addresses, the other every candidate they do not already hold (tier 2 tried those). */
export function outwardTier(c: KeyContext, all: string[]): PairSource {
  const near = primeAndOwn(c).map((a) => a.toLowerCase());
  const held = new Set(near);
  return { cross: [near, all.filter((a) => !held.has(a.toLowerCase()))] };
}

/**
 * The derivation of each key: `shapes` over `base` and the first tier, then
 * their two-address shapes over each later tier for the keys still unnamed.
 * A tier's pairs are built only when a key reaches it.
 */
export function deriveTiered(shapes: KeyShape[], base: Pick<Candidates, "addresses" | "words">, tiers: (() => PairSource)[], keys: string[]): Map<string, DerivedKey> {
  const found = new Map<string, DerivedKey>();
  const paired = shapes.filter(isPairShape);
  for (const [i, tier] of tiers.entries()) {
    const rest = keys.filter((k) => !found.has(k.toLowerCase()));
    if (!rest.length || (i > 0 && !paired.length)) break;
    for (const [k, d] of deriveKeys(i === 0 ? shapes : paired, { ...(i === 0 ? base : { addresses: [], words: [] }), ...tier() }, rest)) found.set(k, d);
  }
  return found;
}
