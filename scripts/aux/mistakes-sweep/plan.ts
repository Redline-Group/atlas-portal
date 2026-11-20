// `mistakes:plan`: write the work plan and the chunk files the agents read.
import fs from "node:fs";
import path from "node:path";

import { chunkDocs, docsToEvaluate, planSweep, type MistakeSweepNode, type SweepPlan } from "../../lib/mistakes-sweep.mjs";
import { CHUNKS, FINDINGS, ROOT, WORK, atlasSha, backlinksFor, describe, flag, load, opt } from "./context.ts";

type ByUuid = Map<string, MistakeSweepNode>;
const chunkId = (i: number) => String(i + 1).padStart(3, "0");

function chunkEntry(d: MistakeSweepNode, plan: SweepPlan, byUuid: ByUuid): string {
  // A linked document is here because of something OUTSIDE it, so say what:
  // an agent handed only the citing text cannot tell a stale reference from
  // a fine one.
  const targets = (plan.linkedBecause[d.id] ?? []).map((uuid) => {
    const t = byUuid.get(uuid);
    return t ? `${t.doc_no} - ${t.title} (changed)` : `${uuid} (removed from the atlas)`;
  });
  const why = targets.length ? `Re-queued: cross-references ${targets.join("; ")}\n` : "";
  return `## ${d.doc_no} - ${d.title} [${d.type}]\nUUID: ${d.id}\n${why}\n${d.content}`;
}

function writeChunks(chunks: MistakeSweepNode[][], plan: SweepPlan, byUuid: ByUuid): void {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(CHUNKS, { recursive: true });
  fs.mkdirSync(FINDINGS, { recursive: true });
  chunks.forEach((docs, i) => {
    const body = docs.map((d) => chunkEntry(d, plan, byUuid)).join("\n\n---\n\n");
    fs.writeFileSync(path.join(CHUNKS, `${chunkId(i)}.md`), `${body}\n`);
  });
}

function planFile(plan: SweepPlan, full: boolean, queued: number, chunks: MistakeSweepNode[][]) {
  return {
    createdAt: new Date().toISOString(),
    atlasSha: atlasSha(),
    full,
    counts: {
      new: plan.new.length,
      changed: plan.changed.length,
      linked: plan.linked.length,
      unchanged: plan.unchanged.length,
      removed: plan.removed.length,
    },
    removed: plan.removed,
    linkedBecause: plan.linkedBecause,
    queued,
    chunks: chunks.map((docs, i) => ({ id: chunkId(i), docs: docs.map((d) => d.id) })),
  };
}

function reportPlan(queued: number, chunkCount: number): void {
  console.log(`\nqueued ${queued} documents into ${chunkCount} chunks`);
  console.log(`  chunks:   ${path.relative(ROOT, CHUNKS)}/NNN.md`);
  console.log(`  findings: ${path.relative(ROOT, FINDINGS)}/NNN.jsonl  (one per chunk, write even if empty)`);
  console.log(`  then:     pnpm mistakes:merge`);
}

export function plan(): number {
  const { nodes, state, layout, stale } = load();
  const full = flag("full") || stale;
  const byUuid: ByUuid = new Map(nodes.map((n) => [n.id, n]));
  const sweep = planSweep(nodes, state, { full, backlinks: backlinksFor(nodes, full) });
  describe(sweep, layout);
  let queue = docsToEvaluate(sweep).map((uuid) => byUuid.get(uuid)!);
  const limit = Number.parseInt(opt("limit", ""), 10);
  // A capped run is how a large backlog is worked down over several sittings:
  // the docs left out simply stay in the next plan.
  if (Number.isFinite(limit)) queue = queue.slice(0, limit);

  const chunks = chunkDocs(queue, { maxBytes: Number.parseInt(opt("max-bytes", "40000"), 10) });
  writeChunks(chunks, sweep, byUuid);
  fs.writeFileSync(
    path.join(WORK, "plan.json"),
    `${JSON.stringify(planFile(sweep, full, queue.length, chunks), null, 2)}\n`,
  );
  reportPlan(queue.length, chunks.length);
  return 0;
}
