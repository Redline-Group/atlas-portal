// Scoreboards and console output for the chat bakeoff (eval-bakeoff.ts).
import type { BakeoffQuery } from "./eval-bakeoff-queries.ts";
import { hardFabs, type RunResult } from "./eval-bakeoff-result.ts";
import { printTable } from "./eval-tools-report.ts";

type Metric = (r: RunResult) => number;
const mean = (rs: RunResult[], f: Metric) => (rs.length ? rs.reduce((s, r) => s + f(r), 0) / rs.length : 0);

function modelScore(model: string, results: RunResult[]) {
  const rs = results.filter((r) => r.model === model);
  const ok = rs.filter((r) => !r.error);
  const graded = ok.filter((r) => r.judge); // quality means only over judged runs
  return {
    model,
    meanScore: Number(mean(graded, (r) => r.score ?? 0).toFixed(3)),
    support: Number(mean(graded, (r) => r.judge?.support ?? 0).toFixed(2)),
    completeness: Number(mean(graded, (r) => r.judge?.completeness ?? 0).toFixed(2)),
    honesty: Number(mean(graded, (r) => r.judge?.honesty ?? 0).toFixed(2)),
    unjudged: ok.length - graded.length,
    hardFabPerRun: Number(mean(ok, (r) => hardFabs(r.fabrications)).toFixed(2)),
    repairedPerRun: Number(mean(ok, (r) => r.fabrications.repaired).toFixed(2)),
    citationsPerRun: Number(mean(ok, (r) => r.citations).toFixed(1)),
    meanLatencyS: Number((mean(ok, (r) => r.latencyMs) / 1000).toFixed(1)),
    meanTokens: Math.round(mean(ok, (r) => r.usage.input + r.usage.output)),
    errors: rs.length - ok.length,
  };
}

export const scoreboard = (models: string[], results: RunResult[]) =>
  models.map((model) => modelScore(model, results)).sort((a, b) => b.meanScore - a.meanScore);

function modelRefs(model: string, results: RunResult[]) {
  const ok = results.filter((r) => r.model === model && !r.error);
  const share = (f: (r: RunResult) => boolean) => (ok.length ? `${Math.round((100 * ok.filter(f).length) / ok.length)}%` : "-");
  const sum = (f: Metric) => ok.reduce((s, r) => s + f(r), 0);
  const avg = (f: Metric) => (ok.length ? Number((sum(f) / ok.length).toFixed(2)) : 0);
  const cites = sum((r) => r.citations);
  return {
    model,
    refStyle: share((r) => r.refs.usedRefStyle),
    blockFirst: share((r) => r.refs.blockFirst),
    defsPerRun: avg((r) => r.refs.definitions),
    // The "make the value the link text" directive — the behaviour the per-doc
    // value check depends on. 0% means that check has no coverage on this model.
    valueCitePct: cites ? `${Math.round((100 * sum((r) => r.refs.valueCitations)) / cites)}%` : "-",
    undefLabels: avg((r) => r.refs.undefinedLabels),
    unusedLabels: avg((r) => r.refs.unusedLabels),
    multiLabel: avg((r) => r.refs.multiLabel),
    shippedBrackets: avg((r) => r.refs.shippedBrackets),
    ungroundedValues: avg((r) => r.fabrications.ungroundedValues),
  };
}

// Reference-format compliance — does the model actually write the citation
// format the prompt asks for (docs/plans/reference-citations.md)? Adoption and
// placement are behavioural; undefLabels/multiLabel/shippedBrackets are defects.
export const refBoard = (models: string[], results: RunResult[]) => models.map((model) => modelRefs(model, results));

export function printBoards(scores: ReturnType<typeof scoreboard>, refs: ReturnType<typeof refBoard>) {
  printTable(scores, ["model", "meanScore", "support", "completeness", "honesty", "hardFabPerRun", "repairedPerRun", "citationsPerRun", "meanLatencyS", "meanTokens", "unjudged", "errors"]);
  console.log(`\nreference-format compliance:`);
  printTable(refs, ["model", "refStyle", "blockFirst", "defsPerRun", "valueCitePct", "undefLabels", "unusedLabels", "multiLabel", "shippedBrackets", "ungroundedValues"]);
}

// Per-query score grid — spot which questions separate the field.
export function printQueryGrid(models: string[], queries: BakeoffQuery[], results: RunResult[]) {
  console.log(`\nper-query scores (rows=queries, cols=models):`);
  const mw = Math.max(...queries.map((q) => q.id.length)) + 2;
  console.log(" ".repeat(mw) + models.map((m) => m.split("/")[1].slice(0, 18).padEnd(20)).join(""));
  for (const q of queries) {
    const cells = models.map((m) => {
      const r = results.find((x) => x.model === m && x.id === q.id);
      return (r?.error ? "ERR" : r?.score === null ? "n/j" : String(r?.score ?? "-")).padEnd(20);
    });
    console.log(q.id.padEnd(mw) + cells.join(""));
  }
}
