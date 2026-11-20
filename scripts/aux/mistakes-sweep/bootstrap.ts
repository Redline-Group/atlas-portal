// `mistakes:bootstrap`, a one-off: adopt the existing hand-run sweep as the
// incremental baseline, so the first `plan` queues only what has moved since.
// Refuses unless the artifact was generated at the checked-out commit —
// claiming 11k documents were scanned at a state nobody actually read is
// exactly the silent failure the "only mark scanned when it came back" rule
// exists to prevent.
import fs from "node:fs";
import path from "node:path";

import { advanceState } from "../../lib/mistakes-sweep.mjs";
import { ARTIFACT, ROOT, STATE, atlasSha, flag, load, readJson, type Artifact } from "./context.ts";

/** Why the artifact cannot be adopted, or null when it can. */
function refusal(artifact: Artifact | null, head: string | null): string | null {
  if (!artifact) return `[mistakes] no artifact at ${path.relative(ROOT, ARTIFACT)} — nothing to adopt`;
  if (artifact.atlasSha !== head && !flag("force")) {
    return (
      `[mistakes] artifact was swept at ${String(artifact.atlasSha).slice(0, 8)} but the submodule ` +
      `is at ${String(head).slice(0, 8)}.\n` +
      "  Check out that commit and re-run, or pass --force to accept the drift as unscanned-but-baselined."
    );
  }
  if (fs.existsSync(STATE) && !flag("force")) {
    return `[mistakes] ${path.relative(ROOT, STATE)} already exists — pass --force to overwrite`;
  }
  return null;
}

export function bootstrap(): number {
  const { nodes, nodeMap, state } = load();
  const artifact = readJson<Artifact | null>(ARTIFACT, null);
  const head = atlasSha();
  const refused = refusal(artifact, head);
  if (refused || !artifact) {
    console.error(refused);
    return 1;
  }
  const all = nodes.map((n) => n.id);
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  fs.writeFileSync(
    STATE,
    `${JSON.stringify(advanceState(state, nodeMap, all, [], artifact.atlasSha ?? head), null, 2)}\n`,
  );
  console.log(`baselined ${all.length} documents at ${String(artifact.atlasSha ?? head).slice(0, 8)}`);
  console.log(`wrote ${path.relative(ROOT, STATE)} — the next \`pnpm mistakes:plan\` sweeps only drift`);
  return 0;
}
