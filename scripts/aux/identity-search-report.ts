// The printed tables of identity-search-vector.ts: the introduction and the
// per-band comparison of body vector, search vector and the word and line measures.

import { REPLACE_MAX_OVERLAP } from "../../src/server/preview/identity.ts";
import { auc, quantile, share } from "./identity-corpus.ts";
import { med, pct, qs, rule, type Pair } from "./identity-search-pairs.ts";

type Rule = [string, (p: Pair) => boolean];
type Sep = Record<"body" | "search" | "word" | "line", number>;

const KINDS = ["body", "search"] as const;
const MEASURES = [["body vector", "body"], ["search vector", "search"], ["word containment", "word"], ["line overlap", "line"]] as const;

export function printIntro(scored: Pair[]) {
  const count = (g: Pair["group"]) => scored.filter((p) => p.group === g).length;
  console.log(`
QUESTION
  The identity gate looks at a document whose title changed and decides: was
  it EDITED, or was it REPLACED by a different document? Search already stores
  one vector for each document. Can the gate reuse that vector, or does it
  need a second one made from the body alone?

THE PAIRS BEING SCORED        each pair is an old text and a new text
  real retitle     ${String(count("retitle")).padStart(5)}   from the atlas git history: a document that kept
                           its UUID across a commit and changed its title.
                           Most are edits and a few are true replacements,
                           so a good rule flags few, and the right few.
  sibling swap     ${String(count("sibling")).padStart(5)}   made up: a document paired with a different document
                           under the same parent. These are replacements, and
                           the hard kind. A good rule misses FEW of them.
  unrelated swap   ${String(count("unrelated")).padStart(5)}   made up: a document paired with a random other
                           document. Replacements, and the easy kind.

THE SCORE                     from 0 to 1. High means the two texts are alike.
  body vector      made from the body text alone
  search vector    made from what search stores: the title, then the body
  word containment the share of the old body's words still present, in order
  line overlap     the share of the old body's lines still present`);
}

function printMedians(R: Pair[], S: Pair[], U: Pair[]) {
  console.log(`\n  1. TYPICAL SCORE (the median). A useful measure scores real retitles high\n     and swaps low, with a wide gap between them.\n`);
  console.log(`     ${"".padEnd(18)}${"real retitle".padStart(14)}${"sibling swap".padStart(14)}${"unrelated swap".padStart(16)}`);
  for (const [label, k] of MEASURES) {
    console.log(`     ${label.padEnd(18)}${med(R.map((p) => p[k])).padStart(14)}${med(S.map((p) => p[k])).padStart(14)}${med(U.map((p) => p[k])).padStart(16)}`);
  }
}

function printSeparation(R: Pair[], S: Pair[]): Sep {
  console.log(`\n  2. SEPARATION. Take one real retitle and one sibling swap at random. How\n     often does the real retitle get the higher score? 100% is perfect, 50%\n     is a coin toss.\n`);
  const sep = Object.fromEntries((["body", "search", "word", "line"] as const).map((k) => [k, auc(R.map((p) => p[k]), S.map((p) => p[k]))])) as Sep;
  for (const [label, k] of MEASURES) console.log(`     ${label.padEnd(18)}${(100 * sep[k]).toFixed(1).padStart(6)}%`);
  return sep;
}

const ruleRow = (R: Pair[], S: Pair[], U: Pair[]) => (label: string, f: (p: Pair) => boolean) =>
  console.log(`     ${label.padEnd(36)}${share(R.filter(f).length, R.length).padEnd(24)}${pct(S.filter((p) => !f(p)).length, S.length).padEnd(22)}${pct(U.filter((p) => !f(p)).length, U.length)}`);

function printRules(R: Pair[], S: Pair[], U: Pair[]) {
  console.log(`\n  3. RULES. Each row is one rule the gate could use. Lower is better in\n     both columns, and a rule is only better if it wins both.\n`);
  console.log(`     ${"a pair is called REPLACED when".padEnd(36)}${"real retitles flagged".padEnd(24)}${"sibling swaps missed".padEnd(22)}unrelated missed`);
  console.log(`     ${rule(34).padEnd(36)}${rule(21).padEnd(24)}${rule(20).padEnd(22)}${rule(16)}`);
  const rules: Rule[] = [
    ["today's rule (lines AND words)", (p) => p.bodyTest],
    ["word containment <= 0.50", (p) => p.word <= 0.5],
    ["word containment <= 0.70", (p) => p.word <= 0.7],
    ["search vector <= 0.70", (p) => p.search <= 0.7],
    ["search vector <= 0.75", (p) => p.search <= 0.75],
    ["search vector <= 0.80", (p) => p.search <= 0.8],
    // 0.85 and finer steps above it, for a model whose cosines sit higher than Qwen's.
    ...[0.85, 0.86, 0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94].map((t): Rule => [`search vector <= ${t.toFixed(2)}`, (p) => p.search <= t]),
    ["body vector <= 0.80", (p) => p.body <= 0.8],
    ["body vector <= 0.85", (p) => p.body <= 0.85],
  ];
  const row = ruleRow(R, S, U);
  for (const [label, f] of rules) row(label, f);
}

function printDetail(b: "short" | "mid", R: Pair[], S: Pair[], U: Pair[]) {
  console.log(`\n  DETAIL: spread of each score, at the 5th, 25th, 50th, 75th and 95th percentile`);
  for (const k of ["body", "search", "word", "line"] as const) console.log(`     ${k.padEnd(7)} real retitles ${qs(R.map((p) => p[k]))}   siblings ${qs(S.map((p) => p[k]))}   unrelated ${qs(U.map((p) => p[k]))}`);
  console.log(`\n  DETAIL: how much adding the title moves the score (search minus body), same percentiles`);
  console.log(`     real retitles ${qs(R.map((p) => p.search - p.body))}   siblings ${qs(S.map((p) => p.search - p.body))}`);
  console.log(`\n  DETAIL: rules that combine two measures`);
  const combos: Rule[] = [
    ["routed by size (before thread 7)", (p) => (b === "short" ? p.word <= 0.5 : p.line <= REPLACE_MAX_OVERLAP)],
    ["today's rule, unless search > 0.85", (p) => p.bodyTest && p.search <= 0.85],
    ["today's rule, or search <= 0.70", (p) => p.bodyTest || p.search <= 0.7],
    ["today's rule, or search <= 0.80", (p) => p.bodyTest || p.search <= 0.8],
    ["word <= 0.50, or search <= 0.80", (p) => p.word <= 0.5 || p.search <= 0.8],
    ["word <= 0.70 and search <= 0.85", (p) => p.word <= 0.7 && p.search <= 0.85],
  ];
  const row = ruleRow(R, S, U);
  for (const [label, f] of combos) row(label, f);
  console.log(`\n  DETAIL: if each vector's cut is set to miss the same share of sibling swaps,\n  how many real retitles does each flag?`);
  for (const miss of [0.05, 0.1, 0.2, 0.3]) {
    const cell = KINDS.map((k) => { const t = quantile(S.map((p) => p[k]), 1 - miss); return `${k} <= ${t.toFixed(3)} flags ${share(R.filter((p) => p[k] <= t).length, R.length)}`; });
    console.log(`     missing ${(miss * 100).toFixed(0).padStart(2)}% of siblings:   ${cell.join("   |   ")}`);
  }
}

function bandAnswer(name: string, sep: Sep) {
  const gap = sep.body - sep.search;
  return `  Bodies of ${name.toLowerCase()}: the search vector separates ${(100 * sep.search).toFixed(1)}% and the body vector\n` +
    `    ${(100 * sep.body).toFixed(1)}%. ${Math.abs(gap) < 0.02 ? "The difference is too small to matter, so the stored vector can be reused." : "The difference is large enough to matter, so reuse costs accuracy."}\n` +
    `    Best single measure here: ${(Object.entries(sep) as [string, number][]).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${(100 * v).toFixed(1)}%`).join(", ")}.`;
}

/** Prints the tables for each body-size band; returns one answer paragraph per band. */
export function printBands(scored: Pair[], detail: boolean): string[] {
  const answers: string[] = [];
  for (const b of ["short", "mid"] as const) {
    // Documents stored as a group are reported apart, under --detail.
    const R = scored.filter((p) => p.group === "retitle" && p.band === b && !p.anchor);
    const S = scored.filter((p) => p.group === "sibling" && p.band === b);
    const U = scored.filter((p) => p.group === "unrelated" && p.band === b);
    const name = b === "short" ? "1 TO 3 LINES" : "4 TO 20 LINES";
    console.log(`\n\n${rule(78)}\nBODIES OF ${name}     ${R.length} real retitles, ${S.length} sibling swaps, ${U.length} unrelated swaps\n${rule(78)}`);
    printMedians(R, S, U);
    const sep = printSeparation(R, S);
    printRules(R, S, U);
    answers.push(bandAnswer(name, sep));
    if (detail) printDetail(b, R, S, U);
  }
  return answers;
}
