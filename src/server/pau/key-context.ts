// What a deployment's keys are searched against, nearest first (key-tiers.ts):
// each of its prime's instances, every address its prime's artifact states, and
// the deployment's own addresses (its contracts, their holders and parameters,
// an NFAT Facility's gem), plus the address pairs spells pass in one argument
// list (source-pairs.ts, carried as source material). An instance's docs and a
// prime's artifact are found by doc number from their UUIDs, within one build:
// parentId stops at heading depth 6, where every instance root sits.
import fs from "node:fs";
import type { PauSnapshot } from "../../lib/pau.ts";
import { buildAncestorsWithSelf } from "../../lib/atlasHelpers.ts";
import { roleAccounts } from "../../lib/vaultRoles.ts";
import type { AtlasNode } from "../../types.ts";
import { graphEntities } from "./probe.ts";

const addressesIn = (v: unknown) => roleAccounts(typeof v === "string" ? v : JSON.stringify(v));

/** What the atlas states for one prime: every address under its artifact, and each of its instances' addresses. */
export interface PrimeAtlas {
  addresses: string[];
  instances: string[][];
}

/** One deployment's search context; `stated` are spells' `a,b` pairs. */
export interface KeyContext {
  instances: string[][];
  prime: string[];
  own: string[];
  stated: string[];
}

// docs-shallow.json and docs-deep.json hold their nodes as an array; docs.json keys them by UUID.
function readNodes(files: string[]): Record<string, AtlasNode> {
  const nodes = files.flatMap((f) => Object.values((JSON.parse(fs.readFileSync(f, "utf8")) as { nodes?: AtlasNode[] | Record<string, AtlasNode> }).nodes ?? {}));
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

/** Each prime whose artifact is in the docs, keyed by the artifact's root: the prime's own doc, or a Halo entity's defining doc. */
function primeRoots(docs: Record<string, AtlasNode>, entities: ReturnType<typeof graphEntities>, primes: string[]): Map<string, string> {
  const rootOf = (p: string) => (docs[p] ? p : entities.find((e) => e.id === p)?.doc);
  return new Map(primes.flatMap((p) => { const r = rootOf(p); return r && docs[r] ? [[r, p] as const] : []; }));
}

/**
 * Each prime's atlas, for the primes given (a Halo's entity counts as one), from
 * the graph and the doc files that together hold every node. A missing file
 * throws and a prime whose artifact is not in the docs is left out: an atlas
 * returned for a prime is one that was read, because key-marks.ts marks every
 * argument it does not state.
 */
export function atlasContexts(graphFile: string, docFiles: string[], primes: string[]): Map<string, PrimeAtlas> {
  for (const f of [graphFile, ...docFiles]) if (!fs.existsSync(f)) throw new Error(`${f} not found`);
  const docs = readNodes(docFiles);
  const docNoToId = new Map(Object.values(docs).map((d) => [d.doc_no, d.id]));
  const entities = graphEntities(graphFile);
  const roots = primeRoots(docs, entities, primes);
  const instanceOf = new Map(entities.flatMap((e) => (e.type === "instance" && e.doc && e.prime ? [[e.doc, e.prime] as const] : [])));
  const atlas = new Map([...roots.values()].map((p) => [p, { addresses: new Set<string>(), instances: new Map<string, Set<string>>() }]));
  for (const doc of Object.values(docs)) {
    const found = addressesIn(`${doc.title}\n${doc.content}`);
    if (!found.length) continue;
    const chain = buildAncestorsWithSelf(docs, docNoToId, doc.id);
    const root = chain.findLast((a) => roots.has(a.id));
    const inst = chain.findLast((a) => instanceOf.has(a.id));
    const owners = [root && roots.get(root.id), inst && instanceOf.get(inst.id)].filter((p): p is string => !!p && atlas.has(p));
    for (const p of new Set(owners)) for (const a of found) atlas.get(p)!.addresses.add(a);
    if (inst && owners.includes(instanceOf.get(inst.id)!)) {
      const into = atlas.get(instanceOf.get(inst.id)!)!.instances;
      into.set(inst.id, new Set([...(into.get(inst.id) ?? []), ...found]));
    }
  }
  return new Map([...atlas].map(([p, a]) => [p, { addresses: [...a.addresses], instances: [...a.instances.values()].map((s) => [...s]) }]));
}

/** The addresses a snapshot holds outside its rate limits: its contracts, their holders, parameters, integrations and reads. */
export function snapshotAddresses(snap: PauSnapshot): string[] {
  return addressesIn(snap.contracts.map((c) => ({ ...c, rateLimits: undefined, beam: undefined })));
}
