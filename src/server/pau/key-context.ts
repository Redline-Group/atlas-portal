// The address pairs a deployment's two-address keys are hashed with: pairs that
// belong together, never every address with every other. Two addresses belong
// together when the deployment's prime states both in the atlas, when the
// deployment holds or read both (its contracts, their holders and parameters,
// an NFAT Facility's gem), or when a spell passes both in one argument list
// (source-pairs.ts, carried as source material).
import fs from "node:fs";
import type { PauSnapshot } from "../../lib/pau.ts";

const ADDRESS_RE = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g;
const addressesIn = (v: unknown) => [...new Set((JSON.stringify(v).match(ADDRESS_RE) ?? []).map((a) => a.toLowerCase()))];

type Entity = { id: string; entity_type: string; meta?: string | object | null };

/** The addresses the atlas states in each prime's own parameters and its instances', by prime entity. */
export function atlasAddressesByPrime(file = "public/graph.json"): Map<string, string[]> {
  const out = new Map<string, Set<string>>();
  if (!fs.existsSync(file)) return new Map();
  const graph = JSON.parse(fs.readFileSync(file, "utf8")) as { entities?: Entity[] };
  for (const e of graph.entities ?? []) {
    const meta = (typeof e.meta === "string" ? JSON.parse(e.meta) : (e.meta ?? {})) as { agent_doc_id?: string; params?: unknown };
    const prime = e.entity_type === "agent" ? e.id : meta.agent_doc_id;
    if (!prime || !meta.params) continue;
    const set = out.get(prime) ?? new Set<string>();
    for (const a of addressesIn(meta.params)) set.add(a);
    out.set(prime, set);
  }
  return new Map([...out].map(([p, s]) => [p, [...s]]));
}

/** The addresses a snapshot holds outside its rate limits: its contracts, their holders, parameters, integrations and reads. */
export function snapshotAddresses(snap: PauSnapshot): string[] {
  return addressesIn(snap.contracts.map((c) => ({ ...c, rateLimits: undefined, beam: undefined })));
}

/** Every ordered pair of distinct addresses in `together`, then each `a,b` of `stated`. */
export function contextPairs(together: Iterable<string>, stated: string[] = []): string[][] {
  const xs = [...new Set([...together].map((a) => a.toLowerCase()))];
  const own = xs.flatMap((a) => xs.filter((b) => b !== a).map((b) => [a, b]));
  return [...own, ...stated.map((p) => p.split(","))];
}
