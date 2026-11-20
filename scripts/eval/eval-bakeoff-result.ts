// One cell of the chat bakeoff grid (eval-bakeoff.ts): its row shape, the
// fabrication counts and the score derived from them.
import type { normalizeAndRepair } from "../../src/server/chat/chat-orchestrator.ts";
import type { runDeterministicChecks } from "../../src/server/chat/verify/verify-checks.ts";
import type { JudgeScores } from "./eval-bakeoff-judge.ts";
import { EMPTY_REFS, type RefStats } from "./eval-bakeoff-refs.ts";

type Checks = ReturnType<typeof runDeterministicChecks>;
type Repaired = ReturnType<typeof normalizeAndRepair>;

export interface Fabrications { rawInvalidCitations: number; repaired: number; stripped: number; invalidDocNos: number; ungroundedQuotes: number; ungroundedValues: number; undefinedLabels: number }

export interface RunResult {
  model: string; id: string;
  score: number | null; // null = judge unparseable after retry — excluded from quality means
  judge: JudgeScores | null;
  fabrications: Fabrications;
  refs: RefStats;
  citations: number; rounds: number; toolCalls: number; latencyMs: number;
  usage: { input: number; output: number };
  answer: string; error: string | null;
  // The model's untouched output, kept only when normalization/repair changed it
  // — the shipped `answer` has the definition block expanded away, so this is the
  // only place the reference format can be inspected by eye after the fact.
  rawAnswer?: string;
  // Full tool outputs — lets deterministic checks be recomputed offline after
  // a checker change, without re-paying for the model runs.
  toolTexts?: string[];
}

// Annotated, not inferred: an errored run ships this row as a RunResult, so a
// field missing here would ship a malformed row rather than fail to compile.
export const emptyResult = (model: string, id: string): RunResult => ({
  model, id, score: null, judge: null,
  fabrications: { rawInvalidCitations: 0, repaired: 0, stripped: 0, invalidDocNos: 0, ungroundedQuotes: 0, ungroundedValues: 0, undefinedLabels: 0 },
  refs: { ...EMPTY_REFS },
  citations: 0, rounds: 0, toolCalls: 0, latencyMs: 0, usage: { input: 0, output: 0 }, answer: "", error: null,
});

/** `rawChecks` read the normalized answer before repair; `shipped` read what ships. */
export const countFabrications = (rawChecks: Checks, shipped: Checks, { refs, repair }: Repaired): Fabrications => ({
  rawInvalidCitations: rawChecks.invalidCitations.length,
  repaired: repair.repaired.length,
  stripped: repair.stripped.length,
  invalidDocNos: shipped.invalidDocNos.length,
  ungroundedQuotes: shipped.ungroundedQuotes.length,
  // Both are hard failures in chat-orchestrator's repairedChecks: a figure
  // attributed to a doc that does not contain it, and a citation whose label
  // resolved to nothing and was de-linkified to plain text.
  ungroundedValues: shipped.ungroundedCitationValues.length,
  undefinedLabels: refs.undefinedLabels.length,
});

/** Fabrications that would still ship broken. */
export const hardFabs = (f: Fabrications) =>
  f.stripped + f.invalidDocNos + f.ungroundedQuotes + f.ungroundedValues + f.undefinedLabels;

// Judge quality, penalized by what would still ship broken (hard fabrications)
// and lightly by garbles production had to repair.
export function scoreOf(judge: JudgeScores | null, f: Fabrications): number | null {
  if (!judge) return null;
  const quality = 0.4 * judge.support + 0.3 * judge.completeness + 0.3 * judge.honesty;
  return Number(Math.max(0, quality - 0.15 * hardFabs(f) - 0.05 * f.repaired).toFixed(3));
}
