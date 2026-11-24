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
  const nodes = files.filter((f) => fs.existsSync(f)).flatMap((f) => Object.values((JSON.parse(fs.readFileSync(f, "utf8")) as { nodes?: AtlasNode[] | Record<string, AtlasNode> }).nodes ?? {}));
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

/** Each prime's atlas, for the primes given (a Halo's entity counts as one), from the graph and the doc files that together hold every node. */
export function atlasContexts(graphFile: string, docFiles: string[], primes: string[]): Map<string, PrimeAtlas> {
  const docs = readNodes(docFiles);
  const docNoToId = new Map(Object.values(docs).map((d) => [d.doc_no, d.id]));
  const entities = graphEntities(graphFile);
  const roots = new Map(primes.map((p) => [docs[p] ? p : (entities.find((e) => e.id === p)?.doc ?? p), p]));
  const instanceOf = new Map(entities.flatMap((e) => (e.type === "instance" && e.doc && e.prime ? [[e.doc, e.prime] as const] : [])));
  const atlas = new Map(primes.map((p) => [p, { addresses: new Set<string>(), instances: new Map<string, Set<string>>() }]));
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
