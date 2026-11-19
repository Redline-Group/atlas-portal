import { describe, expect, test } from "vitest";
import type { GoldCase } from "./eval-edit-candidates-gold.ts";
import { auc, operatingPoint, sameQuote, scoreExplain } from "./eval-edit-candidates-score.ts";

const doc = (uuid: string, label: GoldCase["label"], text: string, quotes: string[] = [], vetoes: string[] = []): GoldCase => ({
  uuid, label, docNo: "A.1", title: "T", type: "Core", text, path: [],
  findings: quotes.map((quote) => ({ quote, category: "typo", severity: "high", pass: "language" })),
  vetoes: vetoes.map((quote) => ({ quote, category: "typo", severity: "low", pass: "language" })),
});

describe("screen scoring", () => {
  const rows = [
    { label: "defect" as const, score: 0.9 }, { label: "defect" as const, score: 0.4 },
    { label: "clean" as const, score: 0.5 }, { label: "clean" as const, score: 0.1 },
    { label: "vetoed" as const, score: 0.8 },
  ];
  test("auc counts defect-over-clean pairs", () => expect(auc(rows)).toBe(0.75));
  test("full recall takes the lowest defect score as the threshold", () => {
    expect(operatingPoint(rows, 1)).toEqual({ recall: 1, threshold: 0.4, cleanFlagged: 0.5, vetoedFlagged: 1 });
  });
  test("half recall keeps only the top defect", () => {
    expect(operatingPoint(rows, 0.5)).toMatchObject({ recall: 0.5, threshold: 0.9, cleanFlagged: 0 });
  });
});

describe("explain scoring", () => {
  test("quotes match by containment or a shared run, not by a short common word", () => {
    expect(sameQuote("at the proscribed conversion rate", "the  proscribed conversion rate listed in the Atlas")).toBe(true);
    expect(sameQuote("the rate", "an entirely different sentence about the rate of change")).toBe(true);
    expect(sameQuote("holders of the token must convert", "the Facilitator may veto a proposal")).toBe(false);
  });
  const cases = [
    doc("d", "defect", "pay at the proscribed rate. A fine sentence here.", ["the proscribed rate"], ["A fine sentence"]),
    doc("c", "clean", "nothing wrong in this text"),
  ];
  test("counts gold found, vetoes raised, clean flagged and invalid quotes", () => {
    const s = scoreExplain(cases, [
      { uuid: "d", quote: "proscribed rate" }, { uuid: "d", quote: "A fine sentence here" },
      { uuid: "c", quote: "nothing wrong" }, { uuid: "c", quote: "not in the text" },
    ]);
    expect(s).toMatchObject({ valid: 3, invalid: 1, goldFound: 1, goldTotal: 1, vetoesRaised: 1, vetoesTotal: 1, cleanFlagged: 1, cleanTotal: 1 });
    expect(s.goldFoundByPass).toEqual({ language: [1, 1] });
  });
  test("a screen that sends nothing on finds nothing", () => {
    expect(scoreExplain(cases, [{ uuid: "d", quote: "proscribed rate" }], new Set())).toMatchObject({ goldFound: 0, valid: 0 });
  });
});
