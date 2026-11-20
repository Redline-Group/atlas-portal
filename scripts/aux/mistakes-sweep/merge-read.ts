// Reads the agents' per-chunk findings files for `mistakes:merge`.
import fs from "node:fs";
import path from "node:path";

import { validateFinding, type Mistake, type MistakeSweepNode } from "../../lib/mistakes-sweep.mjs";
import { FINDINGS } from "./context.ts";

export interface PlanChunk {
  id: string;
  docs: string[];
}

export interface ChunkResults {
  incoming: Mistake[];
  evaluated: string[];
  /** Chunk ids that count as unprocessed and stay queued. */
  skipped: string[];
  rejected: number;
}

/** The rows of one chunk's findings file, or null when the chunk is unprocessed. */
function chunkRows(chunk: PlanChunk): unknown[] | null {
  const file = path.join(FINDINGS, `${chunk.id}.jsonl`);
  // No output file = the chunk was never processed. Recording its documents
  // as scanned would retire them from every future plan on the strength of
  // an agent that never ran.
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
  try {
    return lines.map((l) => JSON.parse(l));
  } catch {
    // A truncated last line means the agent died mid-write; the rest of the
    // chunk is unknowable, so the whole chunk stays unscanned.
    console.warn(`[mistakes] chunk ${chunk.id}: malformed JSONL — treating as unprocessed`);
    return null;
  }
}

export function readChunks(chunks: PlanChunk[], nodeMap: Record<string, MistakeSweepNode>): ChunkResults {
  const out: ChunkResults = { incoming: [], evaluated: [], skipped: [], rejected: 0 };
  for (const chunk of chunks) {
    const rows = chunkRows(chunk);
    if (!rows) {
      out.skipped.push(chunk.id);
      continue;
    }
    for (const row of rows) {
      const result = validateFinding(row, nodeMap);
      if (result.ok) out.incoming.push(result.finding);
      else {
        out.rejected++;
        console.warn(`[mistakes] chunk ${chunk.id}: dropped a finding — ${result.reason}`);
      }
    }
    out.evaluated.push(...chunk.docs);
  }
  return out;
}
