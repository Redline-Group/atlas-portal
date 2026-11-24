// The monolithic generation's key naming. Its one-address and (address, id)
// shapes are the same for every deployment, so they are hashed once for every
// key the refresh knows (`prepare`); each deployment then hashes its own
// context pairs for the two-address shapes (key-context.ts). What a deployment's
// previous snapshot settled is reused under the same inputs (key-memo.ts).
import type { DerivedKey, PauSnapshot } from "../../lib/pau.ts";
import { deriveKeys, isPairShape, limitConstants, monolithicShapes, type Candidates, type KeyShape } from "./key-derive.ts";
import { namingInputs, settledFirst, settledKeys, unsettled } from "./key-memo.ts";
import type { SourceMaterial } from "./source-material.ts";
import { withDerivedKeys } from "./snapshot.ts";

type Derive = (key: string) => DerivedKey | null;

/** The shapes over the cached ABIs' constants and the material's names: the linear ones every deployment shares, and the two-address ones its own pairs feed. */
function shapeSets(dir: string, material: SourceMaterial) {
  const constants = [...new Set([...limitConstants(dir), ...material.names])];
  const shapes = constants.flatMap(monolithicShapes);
  return { constants, linear: shapes.filter((s) => !isPairShape(s)), paired: shapes.filter(isPairShape) };
}

type Sets = ReturnType<typeof shapeSets> & { scan: (keys: string[]) => Derive };

/** `shapes` hashed once for every key asked so far; a key first asked later is searched for with the others asked then. */
function sharedScan(shapes: KeyShape[], candidates: Candidates): (keys: string[]) => Derive {
  const found = new Map<string, DerivedKey>();
  const searched = new Set<string>();
  return (keys) => {
    const todo = [...new Set(keys.map((k) => k.toLowerCase()))].filter((k) => !searched.has(k));
    if (todo.length) for (const [k, d] of deriveKeys(shapes, candidates, todo)) found.set(k, d);
    for (const k of todo) searched.add(k);
    return (key) => found.get(key.toLowerCase()) ?? null;
  };
}

/** A snapshot's unsettled keys: the shared scan, then the deployment's own pairs. */
function derive(m: Sets, known: string[], pairs: string[][], todo: string[]): Derive {
  if (!todo.length) return () => null;
  const linear = m.scan([...known, ...todo]);
  const rest = todo.filter((k) => !linear(k));
  const paired = rest.length ? deriveKeys(m.paired, { addresses: [], words: [], pairs }, rest) : new Map<string, DerivedKey>();
  return (key) => linear(key) ?? paired.get(key.toLowerCase()) ?? null;
}

/** The namer for monolithic snapshots, over the material and candidate addresses read once, when first needed. */
export function monolithicNamer(dir: string, material: () => SourceMaterial, addresses: () => string[]) {
  let sets: Sets | undefined;
  const known: string[] = [];
  const setsOf = (): Sets => {
    if (sets) return sets;
    const s = shapeSets(dir, material());
    return (sets = { ...s, scan: sharedScan(s.linear, { addresses: addresses(), words: material().words }) });
  };
  return {
    prepare: (keys: string[]) => void known.push(...keys),
    name(snap: PauSnapshot, prev: PauSnapshot | undefined, pairs: string[][]): PauSnapshot {
      const m = setsOf();
      const inputs = namingInputs(m.constants, addresses(), material().words, pairs);
      const settled = settledKeys(prev, inputs, (d) => !d.facet);
      return { ...withDerivedKeys(snap, settledFirst(settled, derive(m, known, pairs, unsettled(snap, settled)))), keysNamedWith: inputs };
    },
  };
}
