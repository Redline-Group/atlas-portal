// The address pairs a deployment's two-address keys are hashed with: pairs that
// belong together, never every address with every other. Two addresses belong
// together when the deployment's prime states both in the atlas, when the
// deployment holds or read both (its contracts, their holders and parameters,
// an NFAT Facility's gem), or when a spell passes both in one argument list
// (source-pairs.ts, carried as source material).
import type { PauSnapshot } from "../../lib/pau.ts";
import { EVM_ADDRESS_BODY_SRC } from "../../lib/patterns.ts";
import { roleAccounts } from "../../lib/vaultRoles.ts";
import { primeParams } from "./probe.ts";

const PAIR_RE = new RegExp(`^${EVM_ADDRESS_BODY_SRC},${EVM_ADDRESS_BODY_SRC}$`);
const addressesIn = (v: unknown) => roleAccounts(JSON.stringify(v));

/** What a deployment's two-address keys may pair: addresses that belong together, and the pairs spells state as `a,b`. */
export interface KeyContext {
  together: string[];
  stated: string[];
}

/** The addresses the atlas states in each prime's own parameters and its instances', by prime entity. */
export function atlasAddressesByPrime(file = "public/graph.json"): Map<string, string[]> {
  const out = new Map<string, Set<string>>();
  for (const [prime, params] of primeParams(file)) {
    const set = out.get(prime) ?? new Set<string>();
    for (const a of addressesIn(params)) set.add(a);
    out.set(prime, set);
  }
  return new Map([...out].map(([p, s]) => [p, [...s]]));
}

/** The addresses a snapshot holds outside its rate limits: its contracts, their holders, parameters, integrations and reads. */
export function snapshotAddresses(snap: PauSnapshot): string[] {
  return addressesIn(snap.contracts.map((c) => ({ ...c, rateLimits: undefined, beam: undefined })));
}

/** Every ordered pair of distinct `together` addresses, then each well-formed `a,b` of `stated` (stored material, so a bad row is dropped, not hashed). */
export function contextPairs({ together, stated }: KeyContext): string[][] {
  const xs = [...new Set(together.map((a) => a.toLowerCase()))];
  const own = xs.flatMap((a) => xs.filter((b) => b !== a).map((b) => [a, b]));
  const kept = stated.map((p) => p.toLowerCase()).filter((p) => PAIR_RE.test(p));
  return [...own, ...kept.map((p) => p.split(",")).filter(([a, b]) => a !== b)];
}
