// Fill `previews` rows whose diff-base columns are still NULL.
//
// Migration 033 added the columns, and only a build upserts them. A preview
// that is already on disk never rebuilds — the handler bumps last_access and
// serves the bundle — so every row written before the columns existed stays
// NULL. This recomputes the same record a same-sha rebuild would write and
// stores it without resetting created_at or last_access. A later rebuild
// still overwrites it via upsertPreview.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sql } from "../db.ts";
import { config } from "../config.ts";
import { getIndexes } from "../retrieval/indexes.ts";
import { installationToken } from "./github-app.ts";
import { CANONICAL_REPO, makeGhClient } from "./resolve.ts";
import { resolveCandidates } from "./pr-diff.ts";
import { fetchAndExtract } from "./tarball.ts";
import { snapshotFromSrcDir, type Snapshot } from "./snapshot.ts";
import { diffBaseHasLca, diffBaseLabel, diffBaseType } from "./diff-base-record.ts";
import {
  fillPreviewDiffBase,
  listPreviewsWithoutDiffBase,
  type LiveAtlas,
} from "./diff-base-backfill-row.ts";
import { backfillOne, type BackfillCtx, type BackfillDeps } from "./diff-base-backfill-one.ts";

export interface BackfillResult {
  filled: number;
  skipped: number;
  failed: number;
}

export async function servedAtlas(token: string): Promise<LiveAtlas> {
  try {
    const ix = getIndexes();
    if (ix.meta.atlasCommit && ix.docMap.size > 0) {
      return { commit: ix.meta.atlasCommit, snapshot: ix.docMap as unknown as Snapshot };
    }
  } catch {
    /* script / test process — indexes are loaded only by the server boot */
  }
  const rows = (await sql`SELECT atlas_sha FROM sync_state WHERE id = 1`) as { atlas_sha: string | null }[];
  const commit = rows[0]?.atlas_sha;
  if (!commit) throw new Error("no served atlas commit");
  return { commit, snapshot: await loadSnapshot(CANONICAL_REPO, commit, token) };
}

export async function loadSnapshot(
  repo: string,
  sha: string,
  token: string,
  apiTarball = false,
  extract: typeof fetchAndExtract = fetchAndExtract,
): Promise<Snapshot> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "preview-diff-base-"));
  try {
    const { srcDir } = await extract(repo, sha, token, dir, undefined, { apiTarball });
    return snapshotFromSrcDir(srcDir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function realDeps(): BackfillDeps {
  return {
    list: () => listPreviewsWithoutDiffBase(),
    token: () => config.githubToken,
    installationToken,
    gh: makeGhClient,
    candidates: resolveCandidates,
    live: servedAtlas,
    snapshotAt: loadSnapshot,
    fill: (sha, meta, discovered) =>
      fillPreviewDiffBase(sql as unknown as Parameters<typeof fillPreviewDiffBase>[0], sha, meta, discovered),
  };
}

export async function backfillPreviewDiffBases(over: Partial<BackfillDeps> = {}): Promise<BackfillResult> {
  const deps: BackfillDeps = { ...realDeps(), ...over };
  const result: BackfillResult = { filled: 0, skipped: 0, failed: 0 };
  const rows = await deps.list();
  if (rows.length === 0) return result;
  const token = deps.token();
  // No service token means no canonical compare and no archives. Leave the
  // rows NULL for a later boot that has one, rather than guessing.
  if (!token) return { ...result, skipped: rows.length };
  const live = await deps.live(token);
  const ctx: BackfillCtx = { deps, serviceToken: token, live, baseCache: new Map([[live.commit, live.snapshot]]) };
  for (const row of rows) {
    try {
      result[await backfillOne(row, ctx)]++;
    } catch (e) {
      result.failed++;
      console.warn(`[preview] ${row.sha.slice(0, 8)}: diff-base backfill failed (${(e as Error).name || "Error"})`);
    }
  }
  return result;
}

if (import.meta.main) {
  const dry = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : NaN;
  const r = await backfillPreviewDiffBases({
    ...(Number.isFinite(limit) ? { list: async () => (await listPreviewsWithoutDiffBase()).slice(0, limit) } : {}),
    ...(dry
      ? {
          fill: async (sha, meta) => {
            console.log(
              `[preview] ${sha.slice(0, 8)}: dry-run ${diffBaseType(meta)} lca=${diffBaseHasLca(meta)} ${diffBaseLabel(meta)} +${meta.diffCounts?.added ?? "?"}/${meta.diffCounts?.changed ?? "?"}`,
            );
            return true;
          },
        }
      : {}),
  });
  console.log(JSON.stringify(r));
  await sql.end();
}
