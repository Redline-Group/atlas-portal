// `mistakes:merge`: fold agent output into the artifact and advance the state.
import fs from "node:fs";
import path from "node:path";

import { CORPUS_DETECTORS, runCorpusDetectors } from "../../lib/mistakes-corpus.mjs";
import { stampFirstSeen } from "../../lib/mistakes-first-seen.ts";
import { advanceState, mergeFindings, suppressRejected, type Mistake, type MistakeSweepNode } from "../../lib/mistakes-sweep.mjs";
import { ROOT, atlasSha, flag, readJson } from "../atlas-cli-common.ts";
import { ARTIFACT, STATE, WORK, load, type Artifact } from "./context.ts";
import { readChunks, type ChunkResults, type PlanChunk } from "./merge-read.ts";

interface PlanFile {
  atlasSha: string | null;
  full: boolean;
  removed?: string[];
  chunks: PlanChunk[];
}

type Merged = ReturnType<typeof mergeFindings>;

// A full run re-derives everything, corpus-wide findings included: the
// detectors compare across documents, which is the one thing the chunked
// document sweep structurally cannot do. Their previous rows are retired and
// rebuilt, so --full genuinely means "re-derive", not "re-read the documents".
function corpusFindings(full: boolean, nodes: MistakeSweepNode[]): { corpus: Mistake[]; ran: string[] } {
  const corpus = full ? runCorpusDetectors(nodes) : [];
  const ran = full ? Object.keys(CORPUS_DETECTORS) : [];
  if (full) console.log(`corpus detectors: ${ran.join(", ")} → ${corpus.length} findings`);
  return { corpus, ran };
}

function report(plan: PlanFile, read: ChunkResults, merged: Merged, suppressed: number, before: number): void {
  const { skipped, evaluated, rejected } = read;
  console.log(`chunks processed ${plan.chunks.length - skipped.length}/${plan.chunks.length}`);
  if (skipped.length) console.log(`  unprocessed: ${skipped.join(", ")} (stay queued for the next plan)`);
  console.log(`documents evaluated ${evaluated.length}`);
  console.log(`findings: ${merged.kept} kept, ${merged.replaced} replaced, ${merged.added} added${rejected ? `, ${rejected} invalid` : ""}${suppressed ? `, ${suppressed} previously rejected by review` : ""}`);
  console.log(`total ${before} → ${merged.findings.length}`);
}

function write(next: Artifact, nextState: unknown): void {
  fs.writeFileSync(ARTIFACT, `${JSON.stringify(next, null, 2)}\n`);
  fs.writeFileSync(STATE, `${JSON.stringify(nextState, null, 2)}\n`);
  console.log(`\nwrote ${path.relative(ROOT, ARTIFACT)} and ${path.relative(ROOT, STATE)}`);
  console.log("next: pnpm mistakes:render && pnpm cite:check ATLAS-FINDINGS.md");
}

function mergeInto(artifact: Artifact, plan: PlanFile, read: ChunkResults, nodes: MistakeSweepNode[]) {
  const { corpus, ran } = corpusFindings(plan.full || flag("full"), nodes);
  // A finding a human already ruled out must not come back on the next sweep of
  // its document — otherwise the review has to be re-applied by hand each time.
  const vetoed = suppressRejected([...read.incoming, ...corpus], artifact.rejected ?? []);
  const merged = mergeFindings(artifact.findings, vetoed.findings, new Set(read.evaluated), plan.removed ?? [], {
    dropCorpus: flag("drop-corpus"),
    corpusDetectors: ran,
  });
  return { merged, suppressed: vetoed.suppressed };
}

function nextArtifact(artifact: Artifact, merged: Merged, sha: string | null, documentsScanned: number): Artifact {
  return {
    ...artifact,
    generatedAt: new Date().toISOString().slice(0, 10),
    atlasSha: sha ?? artifact.atlasSha,
    documentsScanned,
    findings: stampFirstSeen(merged.findings, artifact.findings),
  };
}

export function merge(): number {
  const { nodes, nodeMap, state } = load();
  const plan = readJson<PlanFile | null>(path.join(WORK, "plan.json"), null);
  if (!plan) {
    console.error("[mistakes] no plan at .cache/mistakes-sweep/plan.json — run `pnpm mistakes:plan` first");
    return 1;
  }
  const read = readChunks(plan.chunks, nodeMap);
  const artifact = readJson<Artifact>(ARTIFACT, { findings: [] });
  const { merged, suppressed } = mergeInto(artifact, plan, read, nodes);
  const sha = plan.atlasSha ?? atlasSha();
  const next = nextArtifact(artifact, merged, sha, Object.keys(nodeMap).length);
  report(plan, read, merged, suppressed, artifact.findings.length);
  if (flag("dry-run")) {
    console.log("\n--dry-run: nothing written");
    return 0;
  }
  write(next, advanceState(state, nodeMap, read.evaluated, plan.removed ?? [], sha));
  return 0;
}
