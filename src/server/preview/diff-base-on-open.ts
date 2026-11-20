// Fill a private preview's diff-base columns when it is opened, for rows the
// boot backfill (diff-base-backfill.ts) could not reach.

import { sql } from "../db.ts";
import { getPreviewRow } from "./db.ts";
import type { Resolved } from "./resolve.ts";
import { diffBaseLogLine } from "./diff-base-record.ts";
import type { PreviewMeta } from "./cache.ts";
import { fillPreviewDiffBase, type BackfillRow, type DiscoveredBase } from "./diff-base-backfill-row.ts";
import { backfillPreviewDiffBases } from "./diff-base-backfill.ts";

const openInflight = new Set<string>();

type OpenRow = BackfillRow & { diff_base_type: string | null };

interface OpenDeps {
  loadRow: (sha: string) => Promise<OpenRow | null>;
  fill: (sha: string, meta: PreviewMeta, discovered: DiscoveredBase) => Promise<boolean>;
  backfill: typeof backfillPreviewDiffBases;
}

const realDeps: OpenDeps = {
  loadRow: (sha) => getPreviewRow(sha) as Promise<OpenRow | null>,
  fill: (sha, m, discovered) => fillPreviewDiffBase(sql as unknown as Parameters<typeof fillPreviewDiffBase>[0], sha, m, discovered),
  backfill: backfillPreviewDiffBases,
};

function asBackfillRow(row: OpenRow): BackfillRow {
  return {
    sha: row.sha,
    repo: row.repo,
    ref: row.ref,
    kind: row.kind,
    pr_number: row.pr_number,
    private: true,
    pr_base_repo: row.pr_base_repo,
    pr_base_ref: row.pr_base_ref,
    default_branch: row.default_branch,
  };
}

async function fillOnOpen(resolved: Resolved, meta: PreviewMeta | null, deps: OpenDeps): Promise<void> {
  const row = await deps.loadRow(resolved.sha);
  if (!row || row.diff_base_type) return;
  if (meta?.bases) {
    const wrote = await deps.fill(resolved.sha, meta, {
      ...(meta.prBase ? { prBase: meta.prBase } : {}),
      ...(!meta.prBase && meta.defaultBranch ? { defaultBranch: meta.defaultBranch } : {}),
    });
    if (wrote) console.log(diffBaseLogLine(meta).replace(": ", ": backfill "));
    return;
  }
  await deps.backfill({ list: async () => [asBackfillRow(row)] });
}

/** A private preview opened while its diff-base columns are still NULL.
 *  Boot can miss it (no installation token that day). The bundle's own meta
 *  is the record when the build wrote one; otherwise the same one-row pass
 *  boot runs, now with the API tarball the installation token can read.
 *  Returns the in-flight job so a test can settle it; serving does not await it. */
export function fillPrivateDiffBaseOnOpen(
  resolved: Resolved,
  meta: PreviewMeta | null,
  over: Partial<OpenDeps> = {},
): Promise<void> | undefined {
  if (!resolved.private || openInflight.has(resolved.sha)) return;
  openInflight.add(resolved.sha);
  // `??` per dependency: an override passed as undefined keeps the real one.
  const deps: OpenDeps = {
    loadRow: over.loadRow ?? realDeps.loadRow,
    fill: over.fill ?? realDeps.fill,
    backfill: over.backfill ?? realDeps.backfill,
  };
  return (async () => {
    try {
      await fillOnOpen(resolved, meta, deps);
    } catch (e) {
      console.warn(`[preview] ${resolved.sha.slice(0, 8)}: diff-base backfill failed (${(e as Error).name || "Error"})`);
    } finally {
      openInflight.delete(resolved.sha);
    }
  })();
}
