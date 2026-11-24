// The monolithic generation's key naming. Its one-address and (address, id)
// shapes are the same for every deployment, so they are hashed once for every
// key the refresh knows (`known`); each deployment then searches its own tiers
// for the two-address shapes (key-tiers.ts). What a deployment's previous
// snapshot settled is reused under the same inputs (key-memo.ts).
import type { DerivedKey, PauSnapshot } from "../../lib/pau.ts";
import type { KeyContext } from "./key-context.ts";
import { deriveKeys, isPairShape, limitConstants, monolithicShapes, type Candidates, type KeyShape } from "./key-derive.ts";
import { namingInputs, settledKeys, withSettled } from "./key-memo.ts";
import { deriveTiered, nearTier, outwardTier, primeTier } from "./key-tiers.ts";
import type { SourceMaterial } from "./source-material.ts";

type Derive = (key: string) => DerivedKey | null;

/** `shapes` hashed once for every key asked so far; a key first asked later is searched for with the others asked then. */
function sharedScan(shapes: KeyShape[], candidates: Candidates): (keys: string[]) => Derive {
  const found = new Map<string, DerivedKey>();
  const searched = new Set<string>();
  return (keys) => {
    const todo = [...new Set(keys.map((k) => k.toLowerCase()))].filter((k) => !searched.has(k));
    for (const [k, d] of deriveKeys(shapes, candidates, todo)) found.set(k, d);
    for (const k of todo) searched.add(k);
    return (key) => found.get(key.toLowerCase()) ?? null;
  };
}

/** The shapes over the cached ABIs' constants and the material's names: the shared scan of the linear ones, and the two-address ones each deployment's pairs feed. */
function shapeSets(dir: string, material: SourceMaterial, addresses: string[]) {
  const constants = [...new Set([...limitConstants(dir), ...material.names])];
  const shapes = constants.flatMap(monolithicShapes);
  return { constants, paired: shapes.filter(isPairShape), scan: sharedScan(shapes.filter((s) => !isPairShape(s)), { addresses, words: material.words }) };
}

/** A snapshot's unsettled keys: the shared scan, then the deployment's tiers for what it left. */
function derive(m: ReturnType<typeof shapeSets>, known: string[], context: KeyContext, all: string[], todo: string[]): Derive {
  if (!todo.length) return () => null;
  const linear = m.scan([...known, ...todo]);
  const tiers = [() => nearTier(context), () => primeTier(context), () => outwardTier(context, all)];
  const paired = deriveTiered(m.paired, { addresses: [], words: [] }, tiers, todo.filter((k) => !linear(k)));
  return (key) => linear(key) ?? paired.get(key.toLowerCase()) ?? null;
}

/** Names monolithic snapshots, over the material and candidate addresses read once, when first needed; `known` is every key the refresh has announced. */
export function monolithicNamer(dir: string, material: () => SourceMaterial, addresses: () => string[], known: string[]) {
  let sets: ReturnType<typeof shapeSets> | undefined;
  return (snap: PauSnapshot, prev: PauSnapshot | undefined, context: KeyContext): PauSnapshot => {
    const m = (sets ??= shapeSets(dir, material(), addresses()));
    const inputs = namingInputs(m.constants, addresses(), material().words, context);
    const settled = settledKeys(prev, inputs, (d) => !d.facet);
    return { ...withSettled(snap, settled, (todo) => derive(m, known, context, addresses(), todo)), keysNamedWith: inputs };
  };
}
