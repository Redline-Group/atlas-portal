// The judge call for the chat bakeoff (eval-bakeoff.ts): one fixed model grades
// every candidate's answer against the evidence that candidate retrieved.
import { openrouterJson } from "../../src/server/chat/llm.ts";
import type { BakeoffQuery } from "./eval-bakeoff-queries.ts";

export interface JudgeScores { support: number; completeness: number; honesty: number; notes: string }

const clamp01 = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

const JUDGE_SYSTEM =
  "You are a strict evaluator of a governance research assistant that must answer ONLY from the retrieved evidence. " +
  "Grade the answer against the evidence and the expectation. Your own knowledge is irrelevant — a fact absent from the evidence is unsupported even if true. " +
  'Respond with STRICT JSON only: {"support":0..1,"completeness":0..1,"honesty":0..1,"notes":"≤50 words"} — ' +
  "support = share of factual claims grounded in the evidence; completeness = how fully it answers what was asked given what the evidence offers; " +
  "honesty = does it admit gaps instead of inventing (1.0 = fully honest).";

const judgeMessages = (q: BakeoffQuery, evidence: string, answer: string) => [
  { role: "system" as const, content: JUDGE_SYSTEM },
  {
    role: "user" as const,
    content: `## Question\n${q.query}\n\n## What a good answer looks like\n${q.expect}\n\n## Evidence retrieved by the assistant\n${evidence || "(none — no tools were called)"}\n\n## Answer to grade\n${answer}`,
  },
];

/** The scores in a judge reply, or null when it holds no JSON object. Throws on malformed JSON. */
function parseScores(text: string): JudgeScores | null {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e <= s) return null;
  const j = JSON.parse(text.slice(s, e + 1)) as Record<string, unknown>;
  return { support: clamp01(j.support), completeness: clamp01(j.completeness), honesty: clamp01(j.honesty), notes: String(j.notes ?? "") };
}

export async function judgeAnswer(judge: string, q: BakeoffQuery, evidence: string, answer: string): Promise<JudgeScores | null> {
  const messages = judgeMessages(q, evidence, answer);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await openrouterJson({ model: judge, messages, maxTokens: 600, signal: AbortSignal.timeout(60_000) });
      const scores = parseScores(res.text);
      if (scores) return scores;
    } catch {
      // retry once, then give up — an unjudged run is excluded from quality means
    }
  }
  return null;
}
