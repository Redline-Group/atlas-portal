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
import type { Resolved } from "./resolve.ts";
import type { Snapshot } from "./snapshot.ts";
import { computeDiffArtifacts, writeDiffArtifacts, DIFF_FILES } from "./diff-artifacts.ts";
import { refineJob } from "./identity-refine.ts";
import { loadMergeBases, repoBaseDrift } from "./diff-base-load.ts";
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


type Kept = ("sky" | "repo")[];

/** Writes `diff.<key>.json` etc. for each kept candidate against its own merge base. */
function writeKeyedDiffs(candidates: Candidates, kept: Kept, loaded: Map<string, Snapshot>, opts: WriteCandidateDiffsOpts): RefineJob[] {
  const { resolved, paths, head, mainDocs } = opts;
  const refine: RefineJob[] = [];
  for (const key of kept) {
    const base = loaded.get(candidates[key]!.mergeBase)!;
    // Both compare against their own merge base. sky also drops what live
    // main already has, unless the PR is merged (diff-artifacts.ts); repo's
    // base is another repo's branch, which live main says nothing about.
    const a = computeDiffArtifacts(base, head, key === "sky" && resolved.pr?.state !== "merged" ? mainDocs : undefined);
    writeDiffArtifacts(paths.outDir, a, `.${key}`);
    refine.push(refineJob([`identity.${key}.json`], base, head, a.diff));
  }
  return refine;
}

/** The `auto` base after drops: another kept candidate, or "live-main" with the dropped one's reason. */
function chooseAuto(candidates: Candidates, kept: Kept, failed: Map<string, string>) {
  let auto: PreviewBases["auto"] = candidates.auto;
  let reason = candidates.reason;
  if (auto !== "live-main" && !kept.includes(auto)) {
    reason = failed.get(candidates[auto]!.mergeBase) ?? reason;
    auto = kept[0] ?? "live-main";
  }
  return { auto, reason };
}

/** Points the plain diff names at the `auto` set (or the vs-main set for "live-main"). */
function writeAutoSet(auto: PreviewBases["auto"], kept: Kept, refine: RefineJob[], opts: WriteCandidateDiffsOpts): void {
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
  const { loaded, failed } = await loadMergeBases(candidates, present, opts);

  const kept = present.filter((k) => loaded.has(candidates[k]!.mergeBase));
  const refine = writeKeyedDiffs(candidates, kept, loaded, opts);
  const { auto, reason } = chooseAuto(candidates, kept, failed);
  writeAutoSet(auto, kept, refine, opts);

  const bases: PreviewBases = { auto };
  if (reason) bases.reason = reason;
  if (kept.includes("sky")) bases.sky = stripKey(candidates.sky!);
  if (kept.includes("repo")) {
    const repoCandidate = candidates.repo!;
    bases.repo = stripKey(repoCandidate);
    const drift = await repoBaseDrift(repoCandidate, loaded.get(repoCandidate.mergeBase), opts);
    if (drift) bases.repo.drift = drift;
  }
  return { bases, refine };
}
