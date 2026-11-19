// The Postgres implementation of the edit-candidates store (migration 052).
import { sql } from "../db.ts";
import { toUuidArrayLiteral } from "../pg-array.ts";
import { docRowToNode, loadDocMetaSnapshot } from "../retrieval/indexes.ts";
import { candidateKey, type CandidateWrite, type DocState, type EditStore, type ReplaceBy, type SweptDoc } from "./store.ts";

type Tx = Pick<typeof sql, "unsafe">;
const COLS = "key, doc_id, doc_no, file, category, severity, pass, quote, issue, fix, detector, source, model, first_seen";
const CASTS: Record<number, string> = { 1: "::uuid", 13: "::date" };
const tuple = (base: number): string => `(${Array.from({ length: 14 }, (_, n) => `$${base + n + 1}${CASTS[n] ?? ""}`).join(", ")})`;

async function insertCandidates(tx: Tx, rows: CandidateWrite[], by: ReplaceBy, seen: Map<string, string>): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < rows.length; i += 300) {
    const params: unknown[] = [];
    const values = rows.slice(i, i + 300).map((r) => {
      const key = candidateKey(r);
      const base = params.length;
      const first = r.firstSeen ?? seen.get(key) ?? today;
      params.push(key, r.uuid, r.docNo, r.file, r.category, r.severity, r.pass, r.quote, r.issue, r.fix || null, r.detector ?? null, by.source, by.model, first);
      return tuple(base);
    });
    await tx.unsafe(`INSERT INTO edit_candidates (${COLS}) VALUES ${values.join(",")} ON CONFLICT (key) DO NOTHING`, params);
  }
}

const READ_CONFLICT = `ON CONFLICT (doc_id) DO UPDATE SET
  digest = excluded.digest, source = excluded.source, failures = 0, failed_digest = NULL, swept_at = now()`;

async function recordRead(tx: Tx, docs: SweptDoc[], source: string): Promise<void> {
  for (let i = 0; i < docs.length; i += 1000) {
    const params: unknown[] = [];
    const values = docs.slice(i, i + 1000).map((d) => {
      params.push(d.docId, d.digest, source);
      return `($${params.length - 2}::uuid, $${params.length - 1}, $${params.length})`;
    });
    await tx.unsafe(`INSERT INTO edit_candidate_docs (doc_id, digest, source) VALUES ${values.join(",")} ${READ_CONFLICT}`, params);
  }
}

export const realStore: EditStore = {
  async loadSnapshot() {
    const { atlasSha, rows } = await loadDocMetaSnapshot(sql);
    return { atlasSha, docs: rows.map(docRowToNode) };
  },
  async loadSeedHash() {
    const rows = (await sql`SELECT edit_candidates_seed_hash AS h FROM sync_state WHERE id = 1`) as { h: string | null }[];
    return rows[0]?.h ?? null;
  },
  async loadDocStates() {
    const rows = (await sql`SELECT doc_id, digest, source, failures, failed_digest FROM edit_candidate_docs`) as (DocState & { doc_id: string })[];
    return new Map(rows.map((r) => [r.doc_id, r]));
  },
  async replace(docs, rows, by) {
    const ids = toUuidArrayLiteral(docs.map((d) => d.docId));
    await sql.begin(async (tx) => {
      const old = (await tx`SELECT key, first_seen::text AS seen FROM edit_candidates WHERE doc_id = ANY(${ids}::uuid[])`) as { key: string; seen: string }[];
      await tx`DELETE FROM edit_candidates WHERE doc_id = ANY(${ids}::uuid[])`;
      if (by.corpus) await tx`DELETE FROM edit_candidates WHERE doc_id IS NULL`;
      await insertCandidates(tx, rows, by, new Map(old.map((r) => [r.key, r.seen])));
      await recordRead(tx, docs, by.source);
      if (by.seedHash) await tx`UPDATE sync_state SET edit_candidates_seed_hash = ${by.seedHash} WHERE id = 1`;
    });
  },
  async dropCandidatesOf(docIds) {
    if (docIds.length) await sql`DELETE FROM edit_candidates WHERE doc_id = ANY(${toUuidArrayLiteral(docIds)}::uuid[])`;
  },
  async forgetDocs(docIds) {
    if (docIds.length) await sql`DELETE FROM edit_candidate_docs WHERE doc_id = ANY(${toUuidArrayLiteral(docIds)}::uuid[])`;
  },
  // Keys are hex digests, so the array literal needs no quoting.
  async deleteKeys(keys) {
    if (!keys.length) return 0;
    const gone = (await sql.unsafe(`DELETE FROM edit_candidates WHERE key = ANY($1::text[]) RETURNING key`, [`{${keys.join(",")}}`])) as unknown[];
    return gone.length;
  },
  // A document with no row yet gets one with an empty digest: it holds the count and still reads as never read.
  async bumpFailures(docs) {
    for (const d of docs) {
      await sql`
        INSERT INTO edit_candidate_docs (doc_id, digest, source, failures, failed_digest)
        VALUES (${d.docId}::uuid, '', 'worker', 1, ${d.digest})
        ON CONFLICT (doc_id) DO UPDATE SET
          failures = CASE WHEN edit_candidate_docs.failed_digest = excluded.failed_digest THEN edit_candidate_docs.failures + 1 ELSE 1 END,
          failed_digest = excluded.failed_digest`;
    }
  },
  async loadSpend(month) {
    const rows = (await sql`SELECT usd FROM edit_candidate_spend WHERE month = ${month}`) as { usd: number }[];
    return Number(rows[0]?.usd ?? 0);
  },
  async addSpend(month, usd) {
    await sql`
      INSERT INTO edit_candidate_spend (month, usd, requests) VALUES (${month}, ${usd}, 1)
      ON CONFLICT (month) DO UPDATE SET usd = edit_candidate_spend.usd + excluded.usd, requests = edit_candidate_spend.requests + 1`;
  },
};
