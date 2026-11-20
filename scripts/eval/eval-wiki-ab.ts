// Phase 0 A/B for the constraints-wiki commentary card (docs/research/constraints-wiki.md).
// Same end-to-end stack as eval-harness (runVerifiedChat, exactly as chat.ts drives it),
// two arms per query, paired within a worker so time-varying drift hits both arms equally:
//   base — buildSystemPrompt(ix) as shipped
//   wiki — same + scripts/eval/eval-corpora/wiki-card.md appended to the system prompt
// Deterministic metrics only (no judge model): retrieval rounds, tool messages,
// fabrications, verifier verdicts, latency, tokens. Final answers are
// saved to the report for manual quality judging.
//
//   pnpm eval:wiki-ab
//   pnpm eval:wiki-ab --only lawyer-registry --concurrency 2
import fs from "node:fs";
import path from "node:path";
import type OpenAI from "openai";
import { loadIndexes } from "../../src/server/retrieval/indexes.ts";
import { buildSystemPrompt } from "../../src/server/chat/system-prompt.ts";
import { runVerifiedChat, type HarnessDone } from "../../src/server/chat/chat-orchestrator.ts";
import { makeOpenrouterStream, openrouterJson } from "../../src/server/chat/llm.ts";
import { runDeterministicChecks } from "../../src/server/chat/verify/verify-checks.ts";
import { evidenceFromTranscript } from "../../src/server/chat/verify/verifier.ts";
import { config } from "../../src/server/config.ts";
import { BAKEOFF_QUERIES, type BakeoffQuery } from "./eval-bakeoff-queries.ts";
import { mapPool } from "../../src/server/pool.ts";
import { flag } from "./eval-cli.ts";
import { WIKI_QUERIES } from "./eval-corpora/wiki-queries.ts";

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type Arm = "base" | "wiki";

const ROOT = path.resolve(import.meta.dir, "../..");
const ONLY = new Set(flag("only"));
const CONCURRENCY = Number(flag("concurrency")[0] ?? 3);
const REPORT_PATH = path.join(ROOT, ".cache", "eval-wiki-ab.json");
const CARD = fs.readFileSync(path.join(import.meta.dir, "eval-corpora", "wiki-card.md"), "utf8");

const REUSED_BAKEOFF = new Set(["rewards-paid", "integration-boost-vendors", "spell-history", "primitives-structure"]);
const ALL = [...BAKEOFF_QUERIES.filter((q) => REUSED_BAKEOFF.has(q.id)), ...WIKI_QUERIES];
const queries = ONLY.size ? ALL.filter((q) => ONLY.has(q.id)) : ALL;

if (!config.openrouterApiKey) {
  console.error("OPENROUTER_API_KEY is not set (.env.local).");
  process.exit(1);
}
const ix = loadIndexes();
const SYSTEM: Record<Arm, string> = {
  base: buildSystemPrompt(ix),
  wiki: `${buildSystemPrompt(ix)}\n\n${CARD}`,
};

interface Result {
  id: string;
  arm: Arm;
  toolRounds: number; // assistant messages that made tool calls
  toolMsgs: number; // tool-result messages in the transcript
  fabs: number; // deterministic fabrication count on the final answer
  overall: string | null; // verifier verdict
  emptyAnswer: boolean;
  latencyMs: number;
  usage: { input: number; output: number };
  harnessTokens: number;
  finalAnswer: string;
  error: string | null;
}

const emptyResult = (id: string, arm: Arm): Result => ({
  id, arm, toolRounds: 0, toolMsgs: 0, fabs: 0, overall: null,
  emptyAnswer: false, latencyMs: 0,
  usage: { input: 0, output: 0 }, harnessTokens: 0, finalAnswer: "", error: null,
});

/** The metrics of one finished run, read off its transcript and verdicts. */
function measure(q: BakeoffQuery, done: HarnessDone): Partial<Result> {
  const t: Msg[] = done.transcript;
  const toolTexts = t.filter((m) => m.role === "tool" && typeof m.content === "string").map((m) => m.content as string);
  const c = runDeterministicChecks(done.content, toolTexts, ix, {
    question: q.query,
    evidence: evidenceFromTranscript(t),
  });
  const meta = done.checksMeta ?? [];
  return {
    toolRounds: t.filter((m) => m.role === "assistant" && "tool_calls" in m && Array.isArray(m.tool_calls) && m.tool_calls.length > 0).length,
    toolMsgs: t.filter((m) => m.role === "tool").length,
    fabs: c.invalidCitations.length + c.invalidDocNos.length + c.docNoMismatches.length + c.ungroundedQuotes.length,
    overall: meta.find((m) => m.kind === "verify")?.overall ?? null,
    emptyAnswer: !done.content.trim(),
    usage: done.usage,
    harnessTokens: meta
      .filter((m) => m.kind === "verify")
      .reduce((s, m) => s + (m.inputTokens ?? 0) + (m.outputTokens ?? 0), 0),
    finalAnswer: done.content,
  };
}

async function runOne(q: BakeoffQuery, arm: Arm): Promise<Result> {
  const started = Date.now();
  const base = emptyResult(q.id, arm);
  try {
    const messages: Msg[] = [
      { role: "system", content: SYSTEM[arm] },
      { role: "user", content: q.query },
    ];
    let done: HarnessDone | null = null;
    const gen = runVerifiedChat({
      ix, messages, stream: makeOpenrouterStream({}, [config.chatModel]), jsonCall: openrouterJson,
      question: q.query, signal: AbortSignal.timeout(300_000), maxIterations: config.chatMaxIterations,
    });
    for await (const ev of gen) {
      // Never `ev as typeof done`: inside the body that is the NARROWED type of
      // `done`, which here is `null`, so it asserts the event away to nothing.
      if (ev.type === "done") done = ev as HarnessDone;
    }
    if (!done) throw new Error("no done event");
    return { ...base, ...measure(q, done), latencyMs: Date.now() - started };
  } catch (e) {
    return { ...base, latencyMs: Date.now() - started, error: e instanceof Error ? e.message : String(e) };
  }
}

const results: Result[] = [];
const save = () => {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify({
    ranAt: new Date().toISOString(),
    slots: { chat: config.chatModel, verifier: config.chatVerifierModel },
    cardChars: CARD.length,
    queries: Object.fromEntries(queries.map((q) => [q.id, { query: q.query, expect: q.expect }])),
    results,
  }, null, 2));
};

console.log(`wiki-card A/B — chat=${config.chatModel} verifier=${config.chatVerifierModel || "(none)"}`);
console.log(`${queries.length} queries × 2 arms, card ≈ ${Math.round(CARD.length / 4)} tokens\n`);

await mapPool(queries, Math.max(1, CONCURRENCY), async (query) => {
  // Both arms of a query run back-to-back in the same worker: paired in time.
  for (const arm of ["base", "wiki"] as const) {
    const r = await runOne(query, arm);
    results.push(r);
    save();
    const tag = r.error
      ? `ERROR ${r.error.slice(0, 40)}`
      : `rounds=${r.toolRounds} tools=${r.toolMsgs} fabs=${r.fabs} overall=${r.overall ?? "—"} ${(r.latencyMs / 1000).toFixed(0)}s`;
    console.log(`[${results.length}/${queries.length * 2}] ${query.id.padEnd(26)} ${arm.padEnd(4)} ${tag}`);
  }
});

// ── Summary ────────────────────────────────────────────────────────────────
const byArm = (arm: Arm) => results.filter((r) => r.arm === arm && !r.error);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const dist = (rs: Result[]) => {
  const acc: Record<string, number> = {};
  for (const r of rs) acc[r.overall ?? "none"] = (acc[r.overall ?? "none"] ?? 0) + 1;
  return JSON.stringify(acc);
};
console.log(`\n── per-query paired (base → wiki) ──`);
for (const q of queries) {
  const a = results.find((r) => r.id === q.id && r.arm === "base");
  const b = results.find((r) => r.id === q.id && r.arm === "wiki");
  if (!a || !b) continue;
  const cell = (r: Result) => (r.error ? "ERR" : `r${r.toolRounds} f${r.fabs} ${r.overall ?? "—"} ${(r.latencyMs / 1000).toFixed(0)}s`);
  console.log(`  ${q.id.padEnd(26)} ${cell(a).padEnd(24)} → ${cell(b)}`);
}
for (const arm of ["base", "wiki"] as const) {
  const rs = byArm(arm);
  console.log(`\n── ${arm} (${rs.length} ok of ${results.filter((r) => r.arm === arm).length}) ──`);
  console.log(`  rounds mean        ${mean(rs.map((r) => r.toolRounds)).toFixed(2)}   tool msgs mean ${mean(rs.map((r) => r.toolMsgs)).toFixed(2)}`);
  console.log(`  fabrications total ${rs.reduce((s, r) => s + r.fabs, 0)}`);
  console.log(`  verdicts           ${dist(rs)}`);
  console.log(`  empty answers      ${rs.filter((r) => r.emptyAnswer).length}`);
  console.log(`  latency mean       ${(mean(rs.map((r) => r.latencyMs)) / 1000).toFixed(1)}s`);
  console.log(`  tokens mean        in ${Math.round(mean(rs.map((r) => r.usage.input)))} out ${Math.round(mean(rs.map((r) => r.usage.output)))} harness ${Math.round(mean(rs.map((r) => r.harnessTokens)))}`);
}
console.log(`\nanswers saved to ${REPORT_PATH} — judge answer-quality deltas from there.`);
