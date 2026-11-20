// Per-candidate diff-set computation + base-drift wiring, split out of
// diff-base.ts to keep that file within the ~150-line convention.
//
// The base tarball for EVERY candidate's merge base is fetched from the HEAD
// repo (`resolved.repo`), never the candidate's own repo: a merge base is by
// definition an ancestor of the head commit, so it's reachable there — exactly
// what the pre-split build.ts code did. Base-drift's own tip fetch (see
// computeBaseDrift) is the one place that must fetch from the candidate's OWN
// repo instead, since the base branch's CURRENT tip can be ahead of anything
// the head repo's own history contains.

import fs from "node:fs";
import path from "node:path";
import { config } from "../config.ts";
import { makeGhClient, type Resolved } from "./resolve.ts";
import { loadBaseSnapshot, type Snapshot } from "./snapshot.ts";
import { computeDiffArtifacts, writeDiffArtifacts, DIFF_FILES } from "./diff-artifacts.ts";
import { refineJob } from "./identity-refine.ts";
import { computeBaseDrift } from "./base-drift.ts";
import type { Candidates, Candidate } from "./pr-diff.ts";
import type { BaseCandidateMeta, PreviewBases, PreviewPaths } from "./cache.ts";
import type { Indexes } from "../retrieval/indexes.ts";
import type { RefineJob } from "./identity-refine.ts";

export interface WriteCandidateDiffsOpts {
  resolved: Resolved;
  token: string;
  priv: boolean;
  sha8: string;
  paths: PreviewPaths;
  fetchTree: (repo: string, sha: string, dir: string) => Promise<{ srcDir: string }>;
  head: Snapshot;
  mainDocs: Snapshot;
  live: Indexes;
}

function stripKey(c: Candidate): BaseCandidateMeta {
  const { key: _key, ...meta } = c;
  return meta;
}


type Key = "sky" | "repo";

interface LoadedBases {
  /** Base snapshots by merge base, for every candidate whose tree was fetched. */
  loaded: Map<string, Snapshot>;
  /** Why a merge base has no snapshot, by merge base. */
  failed: Map<string, string>;
}

/** Load each present candidate's base snapshot, deduped by merge base. */
async function loadCandidateBases(candidates: Candidates, present: Key[], opts: WriteCandidateDiffsOpts): Promise<LoadedBases> {
  const { resolved, sha8, paths, fetchTree, mainDocs, live } = opts;
  const loaded = new Map<string, Snapshot>();
  const failed = new Map<string, string>();
  const load = async (mergeBase: string) => {
    try {
      const dir = path.join(paths.dir, `base-${mergeBase.slice(0, 8)}`);
      const main = { atlasCommit: live.meta.atlasCommit, snapshot: () => mainDocs };
      loaded.set(mergeBase, await loadBaseSnapshot(mergeBase, dir, (s, d) => fetchTree(resolved.repo, s, d), main));
    } catch (e) {
      const why = `base ${mergeBase.slice(0, 8)} unavailable (${(e as Error).message})`;
      failed.set(mergeBase, why);
      console.warn(`[preview] ${sha8}: ${why} — diffing against live main`);
    }
  };
  await Promise.all([...new Set(present.map((k) => candidates[k]!.mergeBase))].map(load));
  return { loaded, failed };
}

/** Write one diff set per kept candidate, under its own `.<key>` names. */
function writeKeptDiffs(candidates: Candidates, kept: Key[], loaded: Map<string, Snapshot>, opts: WriteCandidateDiffsOpts): RefineJob[] {
  const { resolved, paths, head, mainDocs } = opts;
  return kept.map((key) => {
    const base = loaded.get(candidates[key]!.mergeBase)!;
    // Both compare against their own merge base. sky also drops what live
    // main already has, unless the PR is merged (diff-artifacts.ts); repo's
    // base is another repo's branch, which live main says nothing about.
    const a = computeDiffArtifacts(base, head, key === "sky" && resolved.pr?.state !== "merged" ? mainDocs : undefined);
    writeDiffArtifacts(paths.outDir, a, `.${key}`);
    return refineJob([`identity.${key}.json`], base, head, a.diff);
  });
}

/** Write the plain-named set: the `auto` candidate's, or the vs-main one. */
function writeAutoDiffs(auto: PreviewBases["auto"], kept: Key[], refine: RefineJob[], opts: WriteCandidateDiffsOpts): void {
  const { paths, head, mainDocs } = opts;
  if (auto === "live-main") {
    const a = computeDiffArtifacts(mainDocs, head);
    writeDiffArtifacts(paths.outDir, a);
    refine.push(refineJob(["identity.json"], mainDocs, head, a.diff));
    return;
  }
  // identity.json is the `auto` verdict, as diff.json is the `auto` diff.
  refine[kept.indexOf(auto)].files.push("identity.json");
  for (const name of DIFF_FILES) {
    fs.copyFileSync(path.join(paths.outDir, `${name}.${auto}.json`), path.join(paths.outDir, `${name}.json`));
  }
}

/** Base-drift for the `repo` candidate. Banner meta, never build-blocking. */
async function repoDrift(repoCandidate: Candidate, mergeBaseSnapshot: Snapshot | undefined, opts: WriteCandidateDiffsOpts) {
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
    return null; // computeBaseDrift is already soft internally; guard anyway
  }
}

/**
 * Load (deduped by mergeBase, so two candidates sharing one merge base fetch
 * it once) each present candidate's base snapshot, write a diff set (diff,
 * before, removed) for every candidate whose base actually loaded, copy the
 * `auto` set to the plain names, and compute base-drift for the `repo`
 * candidate. A candidate whose merge-base tree could not be fetched is
 * DROPPED from the advertised bases rather than silently redlined against
 * live main under its own name — the label and the bytes must agree; when
 * that was the `auto` candidate, `auto` moves to the other one, or to
 * "live-main" with a reason (and the vs-main set goes to the plain names).
 */
export async function writeCandidateDiffs(candidates: Candidates, opts: WriteCandidateDiffsOpts): Promise<{ bases: PreviewBases; refine: RefineJob[] }> {
  const present = (["sky", "repo"] as const).filter((k) => candidates[k]);
  const { loaded, failed } = await loadCandidateBases(candidates, present, opts);
  const kept = present.filter((k) => loaded.has(candidates[k]!.mergeBase));
  const refine = writeKeptDiffs(candidates, kept, loaded, opts);

  let auto: PreviewBases["auto"] = candidates.auto;
  let reason = candidates.reason;
  if (auto !== "live-main" && !kept.includes(auto)) {
    reason = failed.get(candidates[auto]!.mergeBase) ?? reason;
    auto = kept[0] ?? "live-main";
  }
  writeAutoDiffs(auto, kept, refine, opts);

  const bases: PreviewBases = { auto };
  if (reason) bases.reason = reason;
  if (kept.includes("sky")) bases.sky = stripKey(candidates.sky!);
  if (kept.includes("repo")) {
    bases.repo = stripKey(candidates.repo!);
    const drift = await repoDrift(candidates.repo!, loaded.get(candidates.repo!.mergeBase), opts);
    if (drift) bases.repo.drift = drift;
  }
  return { bases, refine };
}
