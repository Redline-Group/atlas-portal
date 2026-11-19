// Stage 1 of the edit-candidates eval: one decision-model request per
// document, answering whether it needs an edit and of which kind. A decision
// model returns probabilities, never text, so this stage only decides which
// documents the explaining model reads.
import path from "node:path";
import { askJev, type JevAnswer, type JevQuestion } from "../../src/server/jev.ts";
import { CATEGORY_LABELS } from "../../src/lib/potentialMistakesIndex.ts";
import type { GoldCase } from "./eval-edit-candidates-gold.ts";
import { cachedCall } from "./eval-vote-evidence-models.ts";

const SETTING =
  "`document` is one document of the Sky Atlas, a governance rulebook; `path` holds the titles of the documents above it.";
const LANGUAGE =
  "a typo, a grammar slip, a wrong word, broken markdown, an unfilled placeholder, leftover copy-paste text, or a name written inconsistently";
const FACTUAL =
  "a number or formula that does not add up, statements that contradict each other, a wrong entity or address label, a reference that points at the wrong document, governance logic that cannot work as written, or a date written as upcoming that is before `today`";
const NOT = "Style preferences and terse wording do not count.";

export const SCREEN_QUESTIONS: Record<string, JevQuestion> = {
  any: { type: "noul", instructions: `${SETTING} Would a careful editor find something in its title or text that needs correcting or updating? That means ${LANGUAGE}; or ${FACTUAL}. ${NOT}` },
  language: { type: "noul", instructions: `${SETTING} Does its title or text contain a language defect: ${LANGUAGE}? ${NOT}` },
  factual: { type: "noul", instructions: `${SETTING} Does its title or text contain a substantive defect: ${FACTUAL}? ${NOT}` },
  kind: {
    type: "choice",
    instructions: `${SETTING} Which one kind of defect, if any, most needs an edit in this document?`,
    criteria: { none: "Nothing needs correcting or updating.", ...CATEGORY_LABELS },
  },
};

export const screenState = (c: GoldCase, today: string) => ({
  today,
  path: c.path,
  document: { title: c.title, type: c.type, text: c.text },
});

export interface ScreenAnswer {
  any: number | null;
  language: number | null;
  factual: number | null;
  /** P(kind = none). */
  none: number | null;
  kind: string | null;
  cost: number | null;
  latencyMs: number;
}

const noul = (a: JevAnswer | undefined): number | null => (a?.type === "noul" ? a.noul : null);

/** One document's answers from one model, cached by the exact request. */
export function screen(cacheDir: string, model: string, c: GoldCase, today: string): Promise<ScreenAnswer | null> {
  const state = screenState(c, today);
  return cachedCall(path.join(cacheDir, "screen"), "jev", { model, state, questions: SCREEN_QUESTIONS }, async () => {
    const run = await askJev({ state, questions: SCREEN_QUESTIONS, model, lane: "edit-candidates-screen", timeoutMs: 90_000 });
    const kind = run.answers.kind?.type === "choice" ? run.answers.kind : null;
    return {
      any: noul(run.answers.any),
      language: noul(run.answers.language),
      factual: noul(run.answers.factual),
      none: kind?.probabilities.none ?? null,
      kind: kind?.choice ?? null,
      cost: run.cost,
      latencyMs: run.latencyMs,
    };
  });
}

/** The ways one answer can be turned into a single "send it on" score. */
export const SCREEN_SCORES: Record<string, (a: ScreenAnswer) => number | null> = {
  any: (a) => a.any,
  "max(language,factual)": (a) => (a.language === null || a.factual === null ? null : Math.max(a.language, a.factual)),
  "1-P(none)": (a) => (a.none === null ? null : 1 - a.none),
};
