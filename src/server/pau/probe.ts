// The atlas's rate-limit keys read live on each RateLimits, so a key the atlas
// names is called unset only when the contract says it has never been set
// (every field of its RateLimitData zero), not merely because no event for it
// was stored. A key the contract holds that the stored history lacks means the
// history is not complete, and the snapshot says so.
import fs from "node:fs";
import { RATE_LIMIT_ID_RE } from "../../lib/atlasHashes.ts";
import type { ChainReader } from "./snapshot.ts";

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

export interface Probe {
  /** Keys read live and never set on the contract. */
  unset: string[];
  /** Whether the contract holds a key its stored history has no event for. */
  missed: boolean;
}

/** Reads each key the replay does not already hold. A failed read says nothing either way. */
export async function probeKeys(read: ChainReader, chain: string, address: string, keys: string[], replayed: Set<string>): Promise<Probe> {
  const todo = [...new Set(keys.map((k) => k.toLowerCase()))].filter((k) => !replayed.has(k));
  if (todo.length === 0) return { unset: [], missed: false };
  const res = await read(chain, todo.map((k) => ({ address, functionName: "getRateLimitData" as const, args: [k] })));
  const unset: string[] = [];
  let missed = false;
  todo.forEach((k, i) => {
    const d = res[i] as Record<string, bigint> | null;
    if (!d) return;
    if (Object.values(d).every((v) => v === 0n)) unset.push(k);
    else missed = true;
  });
  return { unset, missed };
}

export type Params = Record<string, [string, ...unknown[]]>;

/** A graph entity with the prime entity it belongs to: an instance's agent, or the prime itself. */
export interface GraphEntity {
  id: string;
  type: string;
  doc: string | null;
  prime: string | null;
  params: Params | null;
}

type RawEntity = { id: string; entity_type: string; defining_doc_id?: string | null; meta?: string | object | null };

/** Every entity of the graph at `file`; none without one. */
export function graphEntities(file: string): GraphEntity[] {
  if (!fs.existsSync(file)) return [];
  const graph = JSON.parse(fs.readFileSync(file, "utf8")) as { entities?: RawEntity[] };
  return (graph.entities ?? []).map((e) => {
    const meta = (typeof e.meta === "string" ? JSON.parse(e.meta) : (e.meta ?? {})) as { agent_doc_id?: string; params?: Params };
    return { id: e.id, type: e.entity_type, doc: e.defining_doc_id ?? null, prime: e.entity_type === "agent" ? e.id : (meta.agent_doc_id ?? null), params: meta.params ?? null };
  });
}

/** Every RateLimitID hash the atlas states, by the prime entity it belongs to. */
export function atlasKeysByPrime(file = "public/graph.json"): Map<string, string[]> {
  const out = new Map<string, string[]>();
  if (!fs.existsSync(file)) {
    console.warn(`pau: ${file} missing; no atlas key is read live, so none can read as "not set"`);
    return out;
  }
  for (const { prime, params } of graphEntities(file)) {
    if (!prime || !params) continue;
    const keys = Object.entries(params).flatMap(([name, [value]]) => (RATE_LIMIT_ID_RE.test(name) && HASH_RE.test(String(value).trim()) ? [String(value).trim().toLowerCase()] : []));
    if (keys.length) out.set(prime, [...(out.get(prime) ?? []), ...keys]);
  }
  return out;
}
