// The seed pass of the edit-candidates sweep: the committed, reviewed sweep
// (public/potential-mistakes.json and .github/mistakes-sweep-state.json) loaded
// into the database, and its vetoes applied.
import { createHash } from "node:crypto";
import type { EditDeps, Live } from "./deps.ts";
import { candidateKey, type CandidateWrite, type DocState, type SweptDoc } from "./store.ts";

interface SeedArtifact {
  generatedAt: string;
  findings: CandidateWrite[];
  rejected?: CandidateWrite[];
}

/**
 * Whether the committed sweep speaks for a document. It does until the worker
 * has read a version the file has not: a file row for the live version is a
 * reviewed hand run and wins, and one for an older version must not replace
 * what the worker found since.
 */
export function seedApplies(have: DocState | undefined, fileDigest: string, liveDigest: string | undefined): boolean {
  return !have || have.source === "seed" || fileDigest === liveDigest;
}

/**
 * Removes every stored candidate a review has vetoed, and returns the vetoed
 * keys. It runs on each cycle, because a veto must hold against rows written
 * since. A candidate the committed sweep itself lists is kept: a review
 * accepted it after rejecting another reading of the same passage.
 */
export async function vetoPass(deps: EditDeps): Promise<Set<string>> {
  const files = deps.readSeed();
  const artifact = files ? (JSON.parse(files.artifact.toString("utf8")) as SeedArtifact) : null;
  const accepted = new Set((artifact?.findings ?? []).map(candidateKey));
  const keys = new Set((artifact?.rejected ?? []).map(candidateKey).filter((k) => !accepted.has(k)));
  const gone = await deps.store.deleteKeys([...keys]);
  if (gone) console.log(`sync:edit-candidates: veto: ${gone} stored candidates removed`);
  return keys;
}

/** Returns the number of documents seeded, or null when the pass was skipped. */
export async function seedPass(deps: EditDeps, live: Live): Promise<number | null> {
  const files = deps.readSeed();
  const seedHash = files && createHash("sha256").update(files.artifact).update(files.state).digest("hex");
  if (!files || !seedHash || seedHash === (await deps.store.loadSeedHash())) {
    console.log(`sync:edit-candidates: seed skipped (${files ? "committed sweep unchanged" : "no committed sweep"})`);
    return null;
  }
  const artifact = JSON.parse(files.artifact.toString("utf8")) as SeedArtifact;
  const digests = (JSON.parse(files.state.toString("utf8")) as { docs?: Record<string, string> }).docs ?? {};
  const have = await deps.store.loadDocStates();
  const docs: SweptDoc[] = Object.entries(digests)
    .filter(([uuid, digest]) => seedApplies(have.get(uuid), digest, live.digest.get(uuid)))
    .map(([docId, digest]) => ({ docId, digest }));
  const seeded = new Set(docs.map((d) => d.docId));
  const rows = artifact.findings
    .filter((f) => f.uuid === null || seeded.has(f.uuid))
    .map((f) => ({ ...f, firstSeen: f.firstSeen ?? artifact.generatedAt }));
  await deps.store.replace(docs, rows, { source: "seed", model: null, corpus: true, seedHash });
  console.log(`sync:edit-candidates: seed: ${docs.length} documents, ${rows.length} candidates`);
  return docs.length;
}
