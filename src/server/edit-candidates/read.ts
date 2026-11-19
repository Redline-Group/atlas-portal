// The public read of the Edit Candidates sweep.
//
//   GET /api/edit-candidates → the shape of public/potential-mistakes.json
//                              without its vetoes, each finding with `firstSeen`
//
// 503 until the worker has seeded the tables; the page then reads the committed
// file instead, so a fresh database or a DB-less dev box still shows the report.
import { dedupeIds, sortFindings } from "../../../scripts/lib/mistakes-sweep.mjs";
import { sql } from "../db.ts";
import { json } from "../http.ts";
import type { SqlTag } from "../sql-types.ts";

interface Row {
  doc_id: string | null;
  doc_no: string;
  file: string;
  category: string;
  severity: string;
  pass: string;
  quote: string;
  issue: string;
  fix: string | null;
  detector: string | null;
  first_seen: string;
}

const PASSES = {
  language: "Proofreading: typos, grammar, wrong words, copy-paste residue, broken markdown.",
  factual: "Consistency: arithmetic, thresholds, contradictions, wrong entities or addresses, dates, cross-references.",
  deterministic: "Mechanical scans across the whole Atlas.",
};

const toFinding = (r: Row) => ({
  id: `${r.doc_no}#${r.category}`,
  docNo: r.doc_no,
  uuid: r.doc_id,
  file: r.file,
  category: r.category,
  severity: r.severity,
  pass: r.pass,
  quote: r.quote,
  issue: r.issue,
  fix: r.fix,
  ...(r.detector ? { detector: r.detector } : {}),
  firstSeen: r.first_seen,
});

/** The stored sweep, or null while no document has been recorded as read. */
export async function readEditCandidates(db: SqlTag = sql) {
  const meta = (await db`
    SELECT (SELECT count(*)::int FROM edit_candidate_docs WHERE digest <> '') AS docs,
           (SELECT to_char(max(swept_at), 'YYYY-MM-DD') FROM edit_candidate_docs) AS swept,
           (SELECT atlas_sha FROM sync_state WHERE id = 1) AS sha`) as { docs: number; swept: string | null; sha: string | null }[];
  if (!meta[0]?.docs) return null;
  const rows = (await db`
    SELECT doc_id, doc_no, file, category, severity, pass, quote, issue, fix, detector, first_seen::text AS first_seen
    FROM edit_candidates`) as Row[];
  return {
    generatedAt: meta[0].swept ?? "",
    atlasSha: meta[0].sha ?? "",
    documentsScanned: meta[0].docs,
    note: "Written by a model the atlas worker runs over new and changed documents; vetoes are reviewed by hand.",
    passes: PASSES,
    findings: dedupeIds(sortFindings(rows.map(toFinding))),
  };
}

// Public and ungated, like /api/vote-evidence: the report is open to everyone.
export async function handleEditCandidates(): Promise<Response> {
  try {
    const stored = await readEditCandidates();
    if (!stored) return json({ error: "unavailable" }, 503);
    return json(stored, 200, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (e) {
    console.error(`edit-candidates: ${(e as Error).message}`);
    return json({ error: "unavailable" }, 503);
  }
}
