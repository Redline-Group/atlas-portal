// Stage 2 of the edit-candidates eval: a chat model reads a batch of documents
// and writes the findings, in the sweep's row contract
// (.claude/skills/mistakes-report/SKILL.md).
import path from "node:path";
import { openrouterJson } from "../../src/server/chat/llm.ts";
import { CATEGORIES } from "../../src/lib/potentialMistakesIndex.ts";
import type { GoldCase } from "./eval-edit-candidates-gold.ts";
import { cachedCall } from "./eval-vote-evidence-models.ts";

const SYSTEM = `You review documents of the Sky Atlas, a governance rulebook, for things that need an edit.
Report only what a careful editor would change: typos, grammar slips, wrong words, broken markdown, unfilled placeholders, copy-paste residue, inconsistent naming, numbers or formulas that do not add up, contradictions, wrong entities or addresses, broken cross-references, governance logic that cannot work as written, and dates written as upcoming that are before today's date.
Do not report style preferences, terse wording, or anything you cannot point at in the text. Most documents need no edit; report nothing for them.
Reply with one JSON object: {"findings":[{"uuid","category","severity","quote","issue","fix"}]}.
- uuid: the document's UUID from its header line.
- category: one of ${CATEGORIES.join(", ")}.
- severity: high, medium or low. It is your confidence that this is a real defect.
- quote: text copied character for character from the document, long enough to find.
- issue: one sentence on what is wrong.
- fix: the corrected text, or null when the author must decide.`;

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

/** One batch's findings from one model, cached by the exact request; null when the call or its JSON failed. */
export function explain(cacheDir: string, model: string, batch: readonly GoldCase[], today: string): Promise<ExplainRun | null> {
  const messages = [
    { role: "system" as const, content: SYSTEM },
    { role: "user" as const, content: `Today's date is ${today}.\n\n${batch.map(render).join("\n\n")}` },
  ];
  return cachedCall(path.join(cacheDir, "explain"), "llm", { model, messages }, async () => {
    const res = await openrouterJson({ model, messages, maxTokens: 16_000 });
    return { findings: parse(res.text), usage: res.usage, latencyMs: res.latencyMs };
  });
}
