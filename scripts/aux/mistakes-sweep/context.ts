// Paths, flags and atlas loading shared by the `mistakes:*` subcommands.
import path from "node:path";

import { loadAtlasSource } from "../../lib/atlas-source.mjs";
import {
  buildBacklinks,
  emptyState,
  isStateUsable,
  type Mistake,
  type MistakeSweepNode,
  type SweepPlan,
  type SweepState,
} from "../../lib/mistakes-sweep.mjs";
import { scanSourceUuids } from "../../lib/atlas-uuid-scan.ts";
import { ATLAS, ROOT, argv, flag, readJson } from "../atlas-cli-common.ts";

export { ROOT, atlasSha, flag, opt, readJson } from "../atlas-cli-common.ts";

export const ARTIFACT = path.join(ROOT, "public/potential-mistakes.json");
export const STATE = path.join(ROOT, ".github/mistakes-sweep-state.json");
export const WORK = path.join(ROOT, ".cache/mistakes-sweep");
export const CHUNKS = path.join(WORK, "chunks");
export const FINDINGS = path.join(WORK, "findings");

/** public/potential-mistakes.json; fields the sweep does not read pass through. */
export interface Artifact {
  atlasSha?: string | null;
  findings: Mistake[];
  rejected?: Mistake[];
  [key: string]: unknown;
}

export const cmd = argv.find((a) => !a.startsWith("-")) ?? "status";
export function load() {
  const { nodes: loaded, nodeMap: loadedMap, layout } = loadAtlasSource(ATLAS);
  const nodes: MistakeSweepNode[] = loaded;
  const nodeMap: Record<string, MistakeSweepNode> = loadedMap;
  // Attach the source file so validateFinding can stamp it, the way it stamps
  // id and docNo — agents are told not to supply `file`.
  const { fileOf } = scanSourceUuids(ATLAS);
  for (const node of nodes) node.file = fileOf.get(node.id) ?? "";
  const raw = readJson<SweepState | null>(STATE, null);
  // A state from an older digest recipe cannot be compared against the current
  // one. Treating its digests as current would mark changed docs clean, so the
  // run degrades to a full sweep instead — loudly.
  const stale = raw && !isStateUsable(raw);
  if (stale) console.warn(`[mistakes] state v${raw.version} is incompatible — full sweep forced`);
  return { nodes, nodeMap, layout, state: stale || !raw ? emptyState() : raw, stale: !!stale };
}

export function describe(plan: SweepPlan, layout: string): void {
  const pct = ((plan.unchanged.length / Math.max(plan.total, 1)) * 100).toFixed(1);
  console.log(`atlas: ${plan.total} documents (${layout} layout)`);
  console.log(`  new        ${plan.new.length}`);
  console.log(`  changed    ${plan.changed.length}`);
  console.log(`  linked     ${plan.linked.length}  (unchanged, but cross-reference a doc that moved)`);
  console.log(`  unchanged  ${plan.unchanged.length}  (${pct}% skipped)`);
  console.log(`  removed    ${plan.removed.length}`);
}

// The cross-reference expansion is on by default — a citation into a document
// that moved is exactly the class of defect a per-document diff cannot see.
// `--no-backlinks` turns it off for a sitting where only the moved documents
// themselves are worth the tokens.
export const backlinksFor = (nodes: MistakeSweepNode[], full: boolean) =>
  full || flag("no-backlinks") ? null : buildBacklinks(nodes);
