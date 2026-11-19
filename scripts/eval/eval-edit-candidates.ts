// Edit-candidates bakeoff: which decision model should screen atlas documents
// for "needs an edit", and which chat model should then write the findings?
// Gold is the reviewed sweep artifact (./eval-edit-candidates-gold.ts).
//
//   pnpm eval:edit-candidates
//   pnpm eval:edit-candidates --stage screen --screen-models typesafe/jev-1.13
//   pnpm eval:edit-candidates --explain-models anthropic/claude-opus-5.5
//
// Flags: --stage screen|explain|both · --screen-models <id,id> (decision
// models on /systemone) · --explain-models <id,id> (chat models) · --clean <n>
// clean documents screened (1500) · --explain-clean <n> of those also
// explained (300) · --batch-bytes <n> per explain request (16000) · --context
// sends the worker's chunks, neighbours included, instead of documents alone ·
// --pipeline-score <name> · --pipeline-recall <p> · --concurrency <n> (6).
//
// Every answer is cached under .cache/eval-edit-candidates/, so a rerun makes
// no calls and prints the same numbers.
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { politeFetch } from "../../src/lib/upstreamBackoff.ts";
import { mapPool } from "../../src/server/pool.ts";
import { loadAtlasSource } from "../lib/atlas-source.mjs";
import { batches, explain, explainInContext } from "./eval-edit-candidates-explain.ts";
import { buildGold, type GoldCase } from "./eval-edit-candidates-gold.ts";
import { printExplain, printPipeline, printScreen, type ExplainRows, type Prices, type ScreenRows } from "./eval-edit-candidates-report.ts";
import { screen } from "./eval-edit-candidates-screen.ts";

const ROOT = path.resolve(import.meta.dir, "../..");
const CACHE = path.join(ROOT, ".cache", "eval-edit-candidates");
const { values: flags } = parseArgs({
  options: {
    stage: { type: "string", default: "both" },
    "screen-models": { type: "string", default: "google/gemini-decision-1,openai/gpt-6-luna-decisions,liquid/d1.2-ultra,typesafe/jev-1.13" },
    "explain-models": { type: "string", default: "google/gemini-4-carbon,google/gemini-4-hydrogen,anthropic/claude-opus-5.5" },
    clean: { type: "string", default: "1500" },
    "explain-clean": { type: "string", default: "300" },
    "batch-bytes": { type: "string", default: "16000" },
    context: { type: "boolean", default: false },
    "pipeline-score": { type: "string", default: "any" },
    "pipeline-recall": { type: "string", default: "0.9" },
    concurrency: { type: "string", default: "6" },
  },
});
const list = (s: string): string[] => s.split(",").map((m) => m.trim()).filter(Boolean);
const CONC = Number(flags.concurrency);
const TODAY = new Date().toISOString().slice(0, 10);

const { nodes } = loadAtlasSource(path.join(ROOT, "vendor/next-gen-atlas"));

function loadCases(): GoldCase[] {
  const artifact = JSON.parse(fs.readFileSync(path.join(ROOT, "public/potential-mistakes.json"), "utf8"));
  const state = JSON.parse(fs.readFileSync(path.join(ROOT, ".github/mistakes-sweep-state.json"), "utf8"));
  return buildGold(nodes, artifact, new Set(Object.keys(state.docs)), Number(flags.clean));
}

async function listPrices(): Promise<Prices> {
  const res = await politeFetch("https://openrouter.ai/api/v1/models");
  const { data } = (await res.json()) as { data: Array<{ id: string; pricing: { prompt: string; completion: string } }> };
  return Object.fromEntries(data.map((m) => [m.id, { prompt: Number(m.pricing.prompt), completion: Number(m.pricing.completion) }]));
}

async function runScreens(cases: GoldCase[]): Promise<ScreenRows> {
  const screens: ScreenRows = {};
  for (const m of list(flags["screen-models"])) screens[m] = await mapPool(cases, CONC, (c) => screen(CACHE, m, c, TODAY));
  printScreen(cases, screens);
  return screens;
}

async function runExplains(read: GoldCase[]): Promise<ExplainRows> {
  const explains: ExplainRows = {};
  const work = batches(read, Number(flags["batch-bytes"]));
  for (const m of list(flags["explain-models"])) {
    const calls = flags.context ? explainInContext(CACHE, m, read, nodes, TODAY) : work.map((b) => () => explain(CACHE, m, b, TODAY));
    explains[m] = await mapPool(calls, CONC, (call) => call());
  }
  printExplain(read, explains, await listPrices());
  return explains;
}

async function main(): Promise<void> {
  const cases = loadCases();
  const count = (l: string) => cases.filter((c) => c.label === l).length;
  const findings = cases.reduce((n, c) => n + c.findings.length, 0);
  console.log(`gold: ${count("defect")} defect documents (${findings} findings), ${count("vetoed")} vetoed, ${count("clean")} clean`);
  const screens = flags.stage === "explain" ? {} : await runScreens(cases);
  // Clean cases come last and in hash order, so the first N are a fixed sample.
  const clean = cases.filter((c) => c.label === "clean").slice(0, Number(flags["explain-clean"]));
  const read = cases.filter((c) => c.label !== "clean").concat(clean);
  const explains = flags.stage === "screen" ? {} : await runExplains(read);
  if (flags.stage === "both") {
    const subset = Object.fromEntries(Object.entries(screens).map(([m, a]) => [m, read.map((c) => a[cases.indexOf(c)])]));
    printPipeline(read, subset, explains, flags["pipeline-score"], Number(flags["pipeline-recall"]));
  }
  const slim = cases.map(({ text: _text, ...c }) => c);
  const out = { generatedAt: new Date().toISOString(), cases: slim, screens, explains };
  fs.writeFileSync(path.join(ROOT, ".cache/eval-edit-candidates.json"), JSON.stringify(out, null, 2));
}

await main();
