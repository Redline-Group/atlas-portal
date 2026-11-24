// What a deployment's previous snapshot already settled about its keys. A
// derivation is a hash preimage, so one found before still holds and is reused
// instead of hashed for again. A key no candidate named is searched again only
// when the namer's inputs changed (its constants, its candidate addresses and
// pairs, or NAMER_VERSION), since the same inputs fail the same way: without
// this every rebuild searches again for the keys nothing names.
import { createHash } from "node:crypto";
import type { DerivedKey, PauSnapshot } from "../../lib/pau.ts";
import type { KeyContext } from "./key-context.ts";
import { allLimits, withDerivedKeys } from "./snapshot.ts";

/** Raise when a change to the derivation code would name a key differently, so earlier names and misses are dropped. */
export const NAMER_VERSION = 1;

/** The stamp of a monolithic namer's inputs, stored as the snapshot's `keysNamedWith`. */
export function namingInputs(constants: string[], addresses: string[], words: string[] = [], context: KeyContext = { together: [], stated: [] }): string {
  const lower = (xs: string[]) => [...new Set(xs.map((x) => x.toLowerCase()))].sort();
  // The context, not the pairs built from it: the pairs follow from it, and it is linear in size where they are not.
  const sorted = [[...new Set(constants)].sort(), lower(addresses), lower(words), lower(context.together), lower(context.stated)];
  return `${NAMER_VERSION}:${createHash("sha256").update(JSON.stringify(sorted)).digest("hex").slice(0, 16)}`;
}

/** A diamond's stamp: its derivations are reused, its misses never are, because a facet hook's live reads also decide them. */
export const DIAMOND_INPUTS = `${NAMER_VERSION}:diamond`;

/**
 * A lookup of what `prev` settled: a derivation it holds that `keep` accepts,
 * or null for a key it left unnamed when it was named from `inputs`;
 * undefined for anything else. Nothing is settled across a NAMER_VERSION.
 */
export function settledKeys(prev: PauSnapshot | undefined, inputs: string, keep: (d: DerivedKey) => boolean): (key: string) => DerivedKey | null | undefined {
  const out = new Map<string, DerivedKey | null>();
  if (!prev?.keysNamedWith || prev.keysNamedWith.split(":")[0] !== String(NAMER_VERSION)) return () => undefined;
  for (const r of allLimits(prev)) if (r.derived && keep(r.derived)) out.set(r.key.toLowerCase(), r.derived);
  if (prev.keysNamedWith === inputs && inputs !== DIAMOND_INPUTS) {
    for (const r of allLimits(prev)) if (!r.derived && !out.has(r.key.toLowerCase())) out.set(r.key.toLowerCase(), null);
  }
  return (key) => out.get(key.toLowerCase());
}

type Settled = (key: string) => DerivedKey | null | undefined;

/** `snap` with what an earlier snapshot settled, and the rest named by `deriveFor`, which is handed only the keys still to name. */
export function withSettled(snap: PauSnapshot, settled: Settled | undefined, deriveFor: (todo: string[]) => (key: string) => DerivedKey | null): PauSnapshot {
  const derive = deriveFor(allLimits(snap).map((r) => r.key).filter((k) => settled?.(k) === undefined));
  return withDerivedKeys(snap, (key) => {
    const s = settled?.(key);
    return s === undefined ? derive(key) : s;
  });
}
