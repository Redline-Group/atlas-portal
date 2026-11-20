// One row of the diff-base backfill (diff-base-backfill.ts): hydrate the row,
// resolve its candidates, materialize the base and store the record.

import type { GhClient, Resolved } from "./resolve.ts";
import type { Candidates, resolveCandidates } from "./pr-diff.ts";
import type { Snapshot } from "./snapshot.ts";
import { diffBaseLogLine } from "./diff-base-record.ts";
import type { PreviewBases, PreviewMeta } from "./cache.ts";
import {
  materializeDiffBase,
  resolveBackfillRow,
  type BackfillRow,
  type DiscoveredBase,
  type LiveAtlas,
} from "./diff-base-backfill-row.ts";

/** The backfill’s I/O, injected so tests replace each piece. */
export interface BackfillDeps {
  list: () => Promise<BackfillRow[]>;
  token: () => string;
  installationToken: (repo: string) => Promise<string | null>;
  gh: (token: string) => GhClient;
  candidates: typeof resolveCandidates;
  live: (token: string) => Promise<LiveAtlas>;
  /** Checkout `sha` in `repo` and parse it. Throws if the archive is gone.
   *  `apiTarball` is required for a private repo: an installation-token Bearer
   *  is honored on api.github.com/.../tarball/..., and ignored on the public
   *  github.com/.../archive/... URL. */
  snapshotAt: (repo: string, sha: string, token: string, apiTarball?: boolean) => Promise<Snapshot>;
  fill: (sha: string, meta: PreviewMeta, discovered: DiscoveredBase) => Promise<boolean>;
}


export interface BackfillCtx {
  deps: BackfillDeps;
  /** A private row never uses this: it swaps in its installation token. */
  serviceToken: string;
  live: LiveAtlas;
  // Merge bases only. Heads are one-shot and must not accumulate — each is a
  // full atlas, and a table of old previews is a table of distinct heads.
  baseCache: Map<string, Snapshot>;
}

function metaFor(resolved: Resolved, bases: PreviewBases, live: LiveAtlas, counts: { added: number; changed: number }): PreviewMeta {
  return {
    sha: resolved.sha,
    repo: resolved.repo,
    ref: resolved.ref,
    kind: resolved.kind,
    resolvedAt: "",
    docCount: 0,
    buildMs: 0,
    private: resolved.private,
    prBase: resolved.prBase && { repo: resolved.prBase.repo, ref: resolved.prBase.ref },
    defaultBranch: resolved.defaultBranch,
    bases,
    baseAtlasCommit: live.commit,
    diffCounts: counts,
  };
}

// A private row with no installation token (app not configured, not installed,
// or the lookup threw) gets null: the caller skips it rather than redline with
// the service token. The row stays NULL and a later boot retries.
async function rowToken(row: BackfillRow, { deps, serviceToken }: BackfillCtx): Promise<string | null> {
  if (!row.private) return serviceToken;
  try {
    return await deps.installationToken(row.repo);
  } catch {
    return null;
  }
}

function snapshotLoader(row: BackfillRow, resolved: Resolved, token: string, { deps, baseCache }: BackfillCtx) {
  return async (repo: string, sha: string): Promise<Snapshot> => {
    const hit = baseCache.get(sha);
    if (hit && sha !== resolved.sha) return hit;
    const snap = await deps.snapshotAt(repo, sha, token, !!row.private);
    if (sha !== resolved.sha) baseCache.set(sha, snap);
    return snap;
  };
}

export async function backfillOne(row: BackfillRow, ctx: BackfillCtx): Promise<"filled" | "skipped"> {
  const { deps, live } = ctx;
  const token = await rowToken(row, ctx);
  if (!token) return "skipped";
  const hydrated = await resolveBackfillRow(row, deps.gh(token));
  if (hydrated === "skip") return "skipped";
  const { resolved, discovered } = hydrated;
  const candidates: Candidates = await deps.candidates(resolved, {
    token,
    priv: !!row.private,
    atlasCommit: live.commit,
  });
  const materialized = await materializeDiffBase(resolved, candidates, live, snapshotLoader(row, resolved, token, ctx));
  if (materialized === "skip") return "skipped";
  const meta = metaFor(resolved, materialized.bases, live, materialized.counts);
  if (!(await deps.fill(row.sha, meta, discovered))) return "skipped";
  console.log(diffBaseLogLine(meta).replace(": ", ": backfill "));
  return "filled";
}
