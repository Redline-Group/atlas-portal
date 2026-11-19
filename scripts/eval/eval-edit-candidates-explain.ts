// Stage 2 of the edit-candidates eval: a chat model reads a batch of documents
// and writes the findings, under the worker sweep's own instructions
// (src/server/edit-candidates/prompt.ts). The `alone` arm sends each document
// with no neighbours; the `context` arm sends the worker's exact chunks.
import path from "node:path";
import { openrouterJson } from "../../src/server/chat/llm.ts";
import { SWEEP_SYSTEM, chunkMessage, packChunks, sweepIndex, type SweepDoc } from "../../src/server/edit-candidates/prompt.ts";
import type { GoldCase } from "./eval-edit-candidates-gold.ts";
import { cachedCall } from "./eval-vote-evidence-models.ts";

export interface ExplainFinding {
  uuid: string;
  category: string;
  severity: string;
  quote: string;
  issue: string;
  fix: string | null;
}
export interface ExplainRun {
  findings: ExplainFinding[];
  usage: { input: number; output: number };
  latencyMs: number;
}

/** Documents in doc-number order, packed into batches of at most `maxBytes` of text. */
export function batches(cases: readonly GoldCase[], maxBytes: number): GoldCase[][] {
  const sorted = [...cases].sort((a, b) => a.docNo.localeCompare(b.docNo, undefined, { numeric: true }));
  const out: GoldCase[][] = [[]];
  let size = 0;
  for (const c of sorted) {
    if (size + c.text.length > maxBytes && out.at(-1)!.length) {
      out.push([]);
      size = 0;
    }
    out.at(-1)!.push(c);
    size += c.text.length;
  }
  return out;
}

const render = (c: GoldCase): string =>
  `=== UUID ${c.uuid} | ${c.path.join(" > ")} > ${c.title} [${c.type}]\n${c.text}`;

function parse(text: string): ExplainFinding[] {
  const rows = (JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as { findings?: unknown }).findings;
  if (!Array.isArray(rows)) throw new Error("no findings array");
  return rows.filter((r): r is ExplainFinding => typeof r?.uuid === "string" && typeof r?.quote === "string");
}

/** One request's findings from one model, cached by the exact request; null when the call or its JSON failed. */
function ask(cacheDir: string, model: string, user: string): Promise<ExplainRun | null> {
  const messages = [
    { role: "system" as const, content: SWEEP_SYSTEM },
    { role: "user" as const, content: user },
  ];
  return cachedCall(path.join(cacheDir, "explain"), "llm", { model, messages }, async () => {
    const res = await openrouterJson({ model, messages, maxTokens: 16_000 });
    return { findings: parse(res.text), usage: res.usage, latencyMs: res.latencyMs };
  });
}

/** The `alone` arm: one batch of documents, each with only its ancestor titles. */
export function explain(cacheDir: string, model: string, batch: readonly GoldCase[], today: string): Promise<ExplainRun | null> {
  return ask(cacheDir, model, `Today's date is ${today}.\n\n${batch.map(render).join("\n\n")}`);
}

/** The `context` arm: the cases as the worker would chunk them, neighbours included. */
export function explainInContext(cacheDir: string, model: string, cases: readonly GoldCase[], atlas: readonly SweepDoc[], today: string) {
  const index = sweepIndex(atlas);
  const queue = atlas.filter((d) => cases.some((c) => c.uuid === d.id));
  return packChunks(queue, index).map((chunk) => () => ask(cacheDir, model, chunkMessage(chunk, index, today)));
}
