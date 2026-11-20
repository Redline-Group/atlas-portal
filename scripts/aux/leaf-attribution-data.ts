// Inputs for leaf-attribution-experiment.ts: the queries whose target is folded
// into a group, and one vector per group member.
import fs from "node:fs";
import path from "node:path";
import type { AtlasNode } from "../../src/types.ts";
import { buildUnits } from "../../src/server/retrieval/embed-units.ts";
import { contentHash, buildEmbedText } from "../../src/server/retrieval/embed-text.ts";
import { embedBatch } from "../../src/server/retrieval/embed.ts";
import { generateRetrievalQueries } from "../eval/eval-retrieval-queries.ts";

const ROOT = path.resolve(import.meta.dir, "../..");
const POLICY = (process.argv.find((a) => a.startsWith("--policy="))?.split("=")[1] ??
  "kv_records_breadcrumbs") as Parameters<typeof buildUnits>[1];

export type Unit = ReturnType<typeof buildUnits>[number];
export interface Case {
  q: ReturnType<typeof generateRetrievalQueries>[number];
  target: string;
  unit: Unit;
}
/** content hash → L2-normalised vector */
export type VectorCache = Map<string, number[]>;
export type DocsById = Map<string, AtlasNode>;

function parseVec(s: string): number[] {
  return s.replace(/^\[|\]$/g, "").split(",").map(Number);
}

export function loadCases(): { byId: DocsById; units: Unit[]; cases: Case[] } {
  const docs = Object.values(
    (JSON.parse(fs.readFileSync(path.join(ROOT, "public/docs.json"), "utf8")) as { nodes: Record<string, AtlasNode> }).nodes,
  );
  const byId = new Map(docs.map((d) => [d.id, d]));

  const units = buildUnits(docs, POLICY, {});
  const owner = new Map<string, Unit>();
  for (const u of units) if (u.memberIds.length > 1) for (const id of u.memberIds) owner.set(id, u);

  const cases = generateRetrievalQueries(docs)
    .filter((q) => ["kv-record", "icd-param", "icd-disambiguation"].includes(q.slice))
    .map((q) => ({ q, target: q.relevant[0]!, unit: owner.get(q.relevant[0]!) }))
    .filter((c): c is Case => !!c.unit);

  console.log(`policy=${POLICY} · ${cases.length} queries whose target is folded into a group`);
  return { byId, units, cases };
}

// Leaf vectors: reuse the DB's one-to-one embeddings, keyed by the same content_hash.
export async function loadVectorCache(): Promise<VectorCache> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("needs DATABASE_URL (read-only embedding cache)");
  const { SQL } = await import("bun");
  const sql = new SQL({ url, max: 2 });
  const cache: VectorCache = new Map();
  try {
    const rows = (await sql`SELECT DISTINCT ON (content_hash) content_hash, embedding::text AS embedding FROM atlas_doc_embeddings`) as {
      content_hash: string;
      embedding: string;
    }[];
    for (const r of rows) cache.set(r.content_hash, parseVec(r.embedding));
  } finally {
    await sql.end();
  }
  console.log(`  leaf-vector cache: ${cache.size} distinct hashes`);
  return cache;
}

// Any member without a cached vector gets embedded once (deduped by hash).
export async function embedMissing(cases: Case[], byId: DocsById, cache: VectorCache): Promise<void> {
  const missing = new Map<string, string>();
  for (const c of cases) {
    for (const id of c.unit.memberIds) {
      const n = byId.get(id);
      if (!n) continue;
      const h = contentHash(n);
      if (!cache.has(h)) missing.set(h, buildEmbedText(n));
    }
  }
  if (!missing.size) return;
  console.log(`  embedding ${missing.size} member texts absent from the DB…`);
  const entries = [...missing.entries()];
  for (let i = 0; i < entries.length; i += 50) {
    const slice = entries.slice(i, i + 50);
    const vecs = await embedBatch(slice.map(([, t]) => t));
    slice.forEach(([h], j) => cache.set(h, vecs[j]!));
  }
}

/** Every group anchor that has a vector, for the shared-residual simulation. */
export function anchorPoolOf(units: Unit[], byId: DocsById, cache: VectorCache) {
  return units
    .filter((u) => u.memberIds.length > 1)
    .map((u) => ({ id: u.anchorId, node: byId.get(u.anchorId)! }))
    .filter((a) => a.node && cache.has(contentHash(a.node)))
    .map((a) => ({ ...a, vec: cache.get(contentHash(a.node))! }));
}
