// Sliced-verifier orchestration: runs the two verifier-slices.ts auditors
// (`refute`, `overreach`) CONCURRENTLY, then — only if either one produced a
// candidate — runs ONE conditional `confirm` call (verify/confirm.ts) to
// independently agree or disagree with each. Two concurrent auditors plus one
// conditional confirm, never four: the clean-answer turn (the overwhelming
// majority) pays for exactly two calls.
//
// PARAGRAPH MODE (CHAT_REFUTE_MODE="paragraph", the default): the caller
// passes `paragraphRefutes` — one ParagraphRefute per paragraph, already
// produced during streaming by verify/paragraph-refute.ts. `refute` is then
// NOT run here (its candidates already exist); only `overreach` runs, and the
// paragraph results are merged (paragraph-merge.ts) into the same backbone
// shape the whole-answer `refute` slice would have produced.
//
// The Verdict is annotate-only: `computeOverall` (verifier.ts) reads it in
// code, so the model can never upgrade its own finding into a worse badge
// than the confirm gate agreed to, or a better one than the deterministic
// checks allow.
import { callWithTimeout, type JsonCall } from "../llm.ts";
import { config } from "../../config.ts";
import { captureEvent, type ErrorContext } from "../../posthog-node.ts";
import type { Indexes } from "../../retrieval/indexes.ts";
import type { CheckReport } from "./verify-checks.ts";
import type { Contradiction, EvidenceEntry, VerifierRun } from "./verifier.ts";
import { runSlice, type SliceName, type SliceResult } from "./verifier-slices.ts";
import { runConfirm } from "./confirm.ts";
import { refuteAbsenceSentences } from "./absence.ts";
import type { ParagraphRefute } from "./paragraph-refute.ts";
import { mergeParagraphRefutes } from "./paragraph-merge.ts";
import { buildVerdict, sumUsage, wholeAnswerBackbone } from "./sliced-verdict.ts";

export const SLICES: SliceName[] = ["refute", "overreach"];

// Per-slice model routing: CHAT_VERIFIER_SLICE_MODELS="refute=m1,confirm=m2";
// unnamed slices fall back to the shared CHAT_VERIFIER_MODEL slot. `confirm`
// is not in SLICES (it isn't run through verifier-slices.ts's runSlice) but
// still gets a routed model here, since sliceModels() is the one place both
// production and the confirm call itself read from.
export function sliceModels(): Record<SliceName, string> {
  const overrides = new Map<string, string>();
  for (const pair of config.chatVerifierSliceModels.split(",")) {
    const i = pair.indexOf("=");
    if (i > 0) overrides.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
  const of = (s: SliceName) => overrides.get(s) || config.chatVerifierModel;
  return { refute: of("refute"), overreach: of("overreach"), confirm: of("confirm") };
}

export interface SlicedVerifierParams {
  call: JsonCall;
  models: Record<SliceName, string>;
  ix: Indexes;
  question: string;
  answer: string;
  evidence: EvidenceEntry[];
  checks: CheckReport;
  signal?: AbortSignal;
  timeoutMs?: number;
  obs?: ErrorContext;
  // Paragraph mode (see header). When present, `refute` is skipped here — its
  // work already happened per paragraph during streaming.
  paragraphRefutes?: ParagraphRefute[];
  // Wall-clock the orchestrator already spent in `refuter.settle()`, folded
  // into the returned `latencyMs` so it reflects the WAIT the reader
  // experiences, not just this function's own two calls.
  settleMs?: number;
}

export async function runSlicedVerifier(params: SlicedVerifierParams): Promise<VerifierRun & { slices: SliceResult[] }> {
  const timeoutMs = params.timeoutMs ?? config.chatVerifierSliceTimeoutMs;
  // Same hard-deadline semantics as every harness call: cancel the provider
  // request on timeout, degrade toward silence — never stall the terminal done.
  const timed: JsonCall = (args) =>
    callWithTimeout(params.call, { model: args.model, messages: args.messages, maxTokens: args.maxTokens }, timeoutMs, params.signal);

  const paragraphMode = params.paragraphRefutes !== undefined;
  const results = await runAuditors(params, timed, paragraphMode);
  const overreachResult = results.find((r) => r.slice === "overreach")!;

  // Two sources of candidate, both already code-validated on their own terms
  // (refute.ts's validateContradictions / paragraph-refute.ts's per-paragraph
  // runSlice; the owner-token bar in absence.ts): the model's own finding(s),
  // and a deterministic parameter-table refutation of an absence sentence the
  // model never had to flag itself.
  const backbone = paragraphMode ? mergeParagraphRefutes(params.paragraphRefutes!) : wholeAnswerBackbone(results);
  const candidates: Contradiction[] = [...backbone.candidates, ...refuteAbsenceSentences(params.answer, params.ix)];

  const confirmModel = params.models.confirm;
  const confirmRun = await confirmGate(params, timed, candidates);

  // A parsed backbone from EITHER slice is enough to produce a verdict — only
  // total silence (neither parsed) degrades to null/unverified. In paragraph
  // mode "the refute slice" is the merged paragraph burst.
  const anyParsed = paragraphMode ? overreachResult.parsed || backbone.parsed : results.some((r) => r.parsed);
  const verdict = anyParsed
    ? buildVerdict({ candidates, overreachResult, results, backbone, confirmRun, confirmModel })
    : null;

  const latencyMs = totalLatency(results, confirmRun?.latencyMs ?? 0, paragraphMode ? { settleMs: params.settleMs ?? 0, overreachMs: overreachResult.latencyMs ?? 0 } : null);

  return {
    verdict,
    usage: sumUsage([...results.map((r) => r.usage), ...backbone.usage, confirmRun?.usage ?? null]),
    generationId: null, // multiple generations; per-slice ids live in `slices`
    latencyMs,
    slices: results,
  };
}

// Runs the auditor slices concurrently; paragraph mode runs only `overreach`.
async function runAuditors(
  params: { models: Record<SliceName, string>; question: string; answer: string; evidence: EvidenceEntry[]; obs?: ErrorContext },
  timed: JsonCall,
  paragraphMode: boolean,
): Promise<SliceResult[]> {
  const slicesToRun: SliceName[] = paragraphMode ? ["overreach"] : SLICES;
  const results = await Promise.all(
    slicesToRun.map((slice) =>
      runSlice({
        call: timed, model: params.models[slice], slice,
        question: params.question, answer: params.answer, evidence: params.evidence,
      }),
    ),
  );
  for (const r of results) {
    if (!r.parsed) captureEvent("chat_slice_unparseable", params.obs, { slice: r.slice, model: params.models[r.slice] });
  }
  return results;
}

// The confirm gate is CONDITIONAL — it costs a call only when there is
// something to look at, so the common clean turn never pays for it. Marks each
// candidate the gate agreed with.
async function confirmGate(
  params: { models: Record<SliceName, string>; answer: string; signal?: AbortSignal; obs?: ErrorContext },
  timed: JsonCall,
  candidates: Contradiction[],
) {
  if (candidates.length === 0) return null;
  const confirmRun = await runConfirm({ call: timed, model: params.models.confirm, answer: params.answer, candidates, signal: params.signal, obs: params.obs });
  for (const i of confirmRun.agreed) candidates[i] = { ...candidates[i], agreed: true };
  return confirmRun;
}

// Wall-clock, not a sum: in whole-answer mode the two slices overlap and
// confirm runs after them; in paragraph mode (`paragraph` set) the settle wait
// already overlapped every paragraph call — overreach and confirm still run
// serially after it.
function totalLatency(results: SliceResult[], confirmMs: number, paragraph: { settleMs: number; overreachMs: number } | null): number | null {
  return paragraph
    ? paragraph.settleMs + paragraph.overreachMs + confirmMs || null
    : (Math.max(...results.map((r) => r.latencyMs ?? 0)) + confirmMs) || null;
}
