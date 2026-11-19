// Merge-base loading and base-drift for writeCandidateDiffs (diff-base-write.ts).
import path from "node:path";
import { config } from "../config.ts";
import { makeGhClient } from "./resolve.ts";
import { loadBaseSnapshot, type Snapshot } from "./snapshot.ts";
import { computeBaseDrift } from "./base-drift.ts";
import type { Candidates, Candidate } from "./pr-diff.ts";
import type { WriteCandidateDiffsOpts } from "./diff-base-write.ts";

function loadMergeBase(mergeBase: string, opts: WriteCandidateDiffsOpts): Promise<Snapshot> {
  const { resolved, paths, fetchTree, mainDocs, live } = opts;
  return loadBaseSnapshot(
    mergeBase,
    path.join(paths.dir, `base-${mergeBase.slice(0, 8)}`),
    (s, d) => fetchTree(resolved.repo, s, d),
    { atlasCommit: live.meta.atlasCommit, snapshot: () => mainDocs },
  );
}

/** Loads each distinct merge base once; a base that cannot be fetched lands in `failed` with its reason. */
export async function loadMergeBases(
  candidates: Candidates,
  present: readonly ("sky" | "repo")[],
  opts: WriteCandidateDiffsOpts,
) {
  const { sha8 } = opts;
  const loaded = new Map<string, Snapshot>();
  const failed = new Map<string, string>();
  await Promise.all(
    [...new Set(present.map((k) => candidates[k]!.mergeBase))].map(async (mergeBase) => {
      try {
        loaded.set(mergeBase, await loadMergeBase(mergeBase, opts));
      } catch (e) {
        const why = `base ${mergeBase.slice(0, 8)} unavailable (${(e as Error).message})`;
        failed.set(mergeBase, why);
        console.warn(`[preview] ${sha8}: ${why} — diffing against live main`);
      }
    }),
  );
  return { loaded, failed };
}

/** Base-drift for the `repo` candidate; soft: banner meta, never build-blocking. */
export async function repoBaseDrift(repoCandidate: Candidate, mergeBaseSnapshot: Snapshot | undefined, opts: WriteCandidateDiffsOpts) {
  const { resolved, token, priv, paths, fetchTree, mainDocs, live } = opts;
  try {
    return await computeBaseDrift({
      candidate: repoCandidate,
      prBaseSha: resolved.prBase?.sha,
      priv,
      repoGh: makeGhClient(token),
      canonicalGh: makeGhClient(config.githubToken),
      live: { atlasCommit: live.meta.atlasCommit ?? "", snapshot: () => mainDocs },
      mergeBaseSnapshot,
      fetchTree: (s, d) => fetchTree(repoCandidate.repo, s, d),
      scratchDir: paths.dir,
    });
  } catch {
    /* computeBaseDrift is already soft internally; guard anyway */
    return undefined;
  }
}
