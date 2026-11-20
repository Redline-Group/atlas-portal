// Model bakeoff for the chat position — runs every query in
// eval-bakeoff-queries.ts through the REAL tool loop once per candidate model,
// grades each transcript two ways, and reports a per-model scoreboard:
//   - deterministic (code, objective): fabricated citations/doc_nos/quotes/
//     values, how many links citation-repair could save, and what would still
//     ship broken — measured on the string production SHIPS (reference links
//     normalized to inline form, then repaired), never on the raw model output
//   - reference-format compliance: adoption of the definition-block format the
//     prompt asks for, and its defect shapes (see docs/plans/reference-citations.md)
//   - judge (one FIXED strong model across all candidates): support,
//     completeness, honesty vs the query's `expect` rubric
//
//   pnpm eval:bakeoff                          default candidate set
//   pnpm eval:bakeoff --models a,b,c           explicit candidates
//   pnpm eval:bakeoff --only <id> [--only id2] subset of queries
//   pnpm eval:bakeoff --judge <model>          override judge (default sonnet-5)
//   pnpm eval:bakeoff --concurrency N          parallel runs (default 4)
//   pnpm eval:bakeoff --resume                 keep prior ok runs from the last
//                                              report, only run missing/errored
//                                              cells (assumes the same judge)
//
// Requires artifacts + OPENROUTER_API_KEY (.env.local); DB-backed tools need
// DATABASE_URL for a faithful run (history queries degrade to tool errors).
import fs from "node:fs";
import path from "node:path";
import { loadIndexes } from "../../src/server/retrieval/indexes.ts";
import { buildSystemPrompt } from "../../src/server/chat/system-prompt.ts";
import { citationStyleFor } from "../../src/server/chat/model-router.ts";
import { runChat, type ChatEvent } from "../../src/server/chat/chat-loop.ts";
import { makeOpenrouterStream } from "../../src/server/chat/llm.ts";
import { evidenceFromTranscript } from "../../src/server/chat/verify/verifier.ts";
import { runDeterministicChecks } from "../../src/server/chat/verify/verify-checks.ts";
import { normalizeAndRepair } from "../../src/server/chat/chat-orchestrator.ts";
import { config } from "../../src/server/config.ts";
import { BAKEOFF_QUERIES, type BakeoffQuery } from "./eval-bakeoff-queries.ts";
import { mapPool } from "../../src/server/pool.ts";
import { argv, flag } from "./eval-cli.ts";
import { judgeAnswer } from "./eval-bakeoff-judge.ts";
import { refStats } from "./eval-bakeoff-refs.ts";
import { countFabrications, emptyResult, scoreOf, type RunResult } from "./eval-bakeoff-result.ts";
import { printBoards, printQueryGrid, refBoard, scoreboard } from "./eval-bakeoff-report.ts";

const ROOT = path.resolve(import.meta.dir, "../..");

// Default = the serious contenders from the 2026-07 core bakeoff. Cut:
// sonnet-5 (lost at 3-50x the price), qwen3-32b (deposed incumbent, bottom
// of the field), tencent/hy3 (provider too flaky to grade).
const MODELS = (flag("models")[0]?.split(",") ?? [
  "google/gemma-4-31b-it", "mistralai/mistral-medium-3-5", "z-ai/glm-5.2",
  "deepseek/deepseek-v4-flash", "anthropic/claude-haiku-4.5",
]).map((m) => m.trim()).filter(Boolean);
const JUDGE = flag("judge")[0] ?? "openai/gpt-5.6-terra"; // outside the candidate set — no self-judging
// --no-judge: generate answers + save full toolTexts, but make NO judge call.
// For human/self grading — read each answer against its own toolTexts offline.
const NO_JUDGE = argv.includes("--no-judge");
const CONCURRENCY = Number(flag("concurrency")[0] ?? 4);
const ONLY = new Set(flag("only"));
const REPORT_PATH = path.join(ROOT, ".cache", "eval-bakeoff.json");

if (!config.openrouterApiKey) {
  console.error("OPENROUTER_API_KEY is not set (.env.local) — cannot run the bakeoff.");
  process.exit(1);
}
const ix = loadIndexes();
const queries = ONLY.size ? BAKEOFF_QUERIES.filter((q) => ONLY.has(q.id)) : BAKEOFF_QUERIES;

// --resume: keep prior successful runs from the last report (same judge
// assumed) and only run the cells that are missing or errored.
const priorOk = new Map<string, RunResult>();
if (argv.includes("--resume") && fs.existsSync(REPORT_PATH)) {
  const prior = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8")) as { results?: RunResult[] };
  for (const r of prior.results ?? []) {
    // Unjudged runs (judge call failed, e.g. on a budget cap) are re-run too —
    // unless --no-judge, where no run has a judge by design and resuming would
    // otherwise re-pay for the entire grid. Rows from a report predating the
    // reference-citation metrics are re-run as well: `refs` is not
    // reconstructible from a stored row.
    if (!r.error && (NO_JUDGE || r.judge) && r.refs && MODELS.includes(r.model) && queries.some((q) => q.id === r.id)) priorOk.set(`${r.model} ${r.id}`, r);
  }
  if (priorOk.size) console.log(`resuming: keeping ${priorOk.size} ok runs from ${REPORT_PATH}`);
}

type Done = Extract<ChatEvent, { type: "done" }>;

/** One candidate's answer to one query through the real tool loop. */
async function answer(model: string, q: BakeoffQuery): Promise<{ done: Done; rounds: number }> {
  const messages = [
    // Production's per-model citation format, so a candidate is graded on the
    // prompt it would actually receive (CHAT_REFERENCE_CITATION_MODELS).
    { role: "system" as const, content: buildSystemPrompt(ix, undefined, citationStyleFor(model)) },
    { role: "user" as const, content: q.query },
  ];
  let done: Done | null = null;
  let rounds = 0;
  // Some models (deepseek) intermittently return an empty final message —
  // retry the chat once so a flake doesn't hole the grid.
  for (let attempt = 0; attempt < 2 && !done?.content.trim(); attempt++) {
    for await (const ev of runChat({
      ix, messages, stream: makeOpenrouterStream({}, [model]),
      maxIterations: config.chatMaxIterations, signal: AbortSignal.timeout(240_000),
      onRoundEnd: (info) => { rounds = Math.max(rounds, info.iter + 1); },
    })) {
      if (ev.type === "done") done = ev;
    }
  }
  if (!done || !done.content.trim()) throw new Error("empty answer");
  return { done, rounds };
}

/** Deterministic checks and the judge call over one finished answer. */
async function grade(q: BakeoffQuery, done: Done) {
  const toolTexts = done.transcript.filter((m) => m.role === "tool" && typeof m.content === "string").map((m) => m.content as string);
  // Production's exact pipeline: expand reference links into the canonical
  // inline shape, THEN repair. Both check passes read normalized text — a
  // reference-style answer contains no `[text](/atlas/<uuid>)` for any checker
  // to see, so grading the raw string would score it as entirely uncited.
  const fixed = normalizeAndRepair(done.content, toolTexts, ix);
  const { refs, repair } = fixed;
  const turnEvidence = evidenceFromTranscript(done.transcript);
  const completeness = { question: q.query, evidence: turnEvidence };
  const rawChecks = runDeterministicChecks(refs.content, toolTexts, ix, completeness); // before repair
  const shipped = runDeterministicChecks(repair.content, toolTexts, ix, completeness); // what ships
  const evidence = turnEvidence.map((e) => `${e.label} ${e.tool}(${e.args}) →\n${e.content}`).join("\n\n");
  const judge = NO_JUDGE ? null : await judgeAnswer(JUDGE, q, evidence, repair.content);
  const fabrications = countFabrications(rawChecks, shipped, fixed);
  return {
    score: scoreOf(judge, fabrications), judge, fabrications,
    refs: refStats(done.content, refs, repair.content),
    citations: shipped.citations.length, answer: repair.content, toolTexts,
    rawAnswer: repair.content === done.content ? undefined : done.content,
  };
}

async function runOne(model: string, q: BakeoffQuery): Promise<RunResult> {
  const started = Date.now();
  const base = emptyResult(model, q.id);
  try {
    const { done, rounds } = await answer(model, q);
    const graded = await grade(q, done);
    return { ...base, ...graded, rounds, toolCalls: done.toolCalls.length, latencyMs: Date.now() - started, usage: done.usage };
  } catch (e) {
    return { ...base, latencyMs: Date.now() - started, error: e instanceof Error ? e.message : String(e) };
  }
}

// Simple worker pool over the model × query grid.
const grid = MODELS.flatMap((model) => queries.map((q) => ({ model, q }))).filter(({ model, q }) => !priorOk.has(`${model} ${q.id}`));
const results: RunResult[] = [...priorOk.values()];
function saveReport(extra: Record<string, unknown> = {}) {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify({ judge: JUDGE, atlasCommit: ix.meta.atlasCommit ?? null, ranAt: new Date().toISOString(), ...extra, results }, null, 2));
}
await mapPool(grid, Math.max(1, CONCURRENCY), async ({ model, q }) => {
  const r = await runOne(model, q);
  results.push(r);
  saveReport(); // incremental — a killed run keeps everything paid for so far
  console.log(`[${results.length - priorOk.size}/${grid.length}] ${model} × ${q.id} → ${r.error ? `ERROR ${r.error.slice(0, 60)}` : `score=${r.score}`}`);
});

// ── Scoreboard ─────────────────────────────────────────────────────────────
const byModel = scoreboard(MODELS, results);
const refs = refBoard(MODELS, results);
saveReport({ scoreboard: byModel, refBoard: refs });

console.log(`\njudge=${NO_JUDGE ? "(none — self/manual grading)" : JUDGE}  queries=${queries.length}  atlas=${(ix.meta.atlasCommit ?? "?").slice(0, 8)}`);
printBoards(byModel, refs);
printQueryGrid(MODELS, queries, results);
console.log(`\nwrote ${REPORT_PATH}`);
