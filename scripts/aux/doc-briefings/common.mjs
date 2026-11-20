// Shared helpers for the briefings driver's subcommands: paths, flags, the
// atlas load, and the database read.
import path from "node:path";

import { loadAtlasSource } from "../../lib/atlas-source.mjs";
import { BRIEFING_MAX_FAILURES } from "../../lib/doc-briefings.mjs";
import { emptyState, isStateUsable } from "../../lib/mistakes-sweep.mjs";
import { ATLAS, ROOT, readJson } from "../atlas-cli-common.ts";

export { ROOT, argv, atlasSha, flag, opt, readJson } from "../atlas-cli-common.ts";

export const ARTIFACT = path.join(ROOT, "public/doc-briefings.json");
export const STATE = path.join(ROOT, ".github/briefings-state.json");
export const WORK = path.join(ROOT, ".cache/atlas-briefings");
export const CHUNKS = path.join(WORK, "chunks");
export const OUT = path.join(WORK, "out");

export const rel = (file) => path.relative(ROOT, file);

export function load() {
  const { nodes, nodeMap, layout } = loadAtlasSource(ATLAS);
  const raw = readJson(STATE, null);
  // A state from another digest recipe cannot be compared with this one, so the
  // run degrades to a full pass — loudly — rather than reading changed
  // documents as described.
  const stale = raw && !isStateUsable(raw);
  if (stale) console.warn(`[briefings] state v${raw.version} is incompatible — full pass forced`);
  return { nodes, nodeMap, layout, state: stale || !raw ? emptyState() : raw, stale: !!stale };
}

export function describe(plan, layout) {
  const pct = ((plan.unchanged.length / Math.max(plan.total, 1)) * 100).toFixed(1);
  console.log(`atlas: ${plan.total} documents (${layout} layout)`);
  console.log(`  new        ${plan.new.length}`);
  console.log(`  changed    ${plan.changed.length}`);
  console.log(`  linked     ${plan.linked.length}  (unchanged, but a parent or a citing document moved)`);
  console.log(`  unchanged  ${plan.unchanged.length}  (${pct}% skipped)`);
  console.log(`  removed    ${plan.removed.length}`);
}

/** Every briefing row in the database, or throws. The database is the live
 *  record: the worker writes there, and this reads it back. `questions` is a
 *  jsonb column and comes back parsed (postgres-jsonb skill); a string is
 *  tolerated in case a driver version hands it back raw. */
export async function readDbRows() {
  const { SQL } = await import("bun");
  const sql = new SQL({ url: process.env.DATABASE_URL, max: 1, connectionTimeout: 5 });
  try {
    const rows = await sql`
      SELECT doc_id, briefing, questions, digest, model, failures
      FROM atlas_doc_briefings
    `;
    return rows.map((r) => ({
      ...r,
      questions: typeof r.questions === "string" ? JSON.parse(r.questions) : r.questions,
    }));
  } finally {
    await sql.end();
  }
}

export const atLimit = (rows) => rows.filter((r) => r.failures >= BRIEFING_MAX_FAILURES).length;
