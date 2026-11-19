// Verdict assembly helpers for sliced-verifier.ts: the whole-answer backbone,
// the Verdict builder, usage summing and notes.
import type { Contradiction, Verdict } from "./verifier.ts";
import type { SliceResult } from "./verifier-slices.ts";
import type { runConfirm } from "./confirm.ts";
import type { mergeParagraphRefutes } from "./paragraph-merge.ts";

type Merged = ReturnType<typeof mergeParagraphRefutes>;
// The whole-answer backbone has no per-paragraph breakdown.
export type Backbone = Omit<Merged, "paragraphs"> & { paragraphs?: Merged["paragraphs"] };

// The whole-answer `refute` slice's output, shaped like a merged paragraph burst.
export function wholeAnswerBackbone(results: SliceResult[]): Backbone {
  const refuteResult = results.find((r) => r.slice === "refute")!;
  return {
    candidates: refuteResult.contradictions,
    discardedTotal: results.reduce((s, r) => s + r.discarded, 0), parsed: refuteResult.parsed,
    notes: "", usage: [] as { input: number; output: number }[],
  };
}

export function buildVerdict(p: {
  candidates: Contradiction[];
  overreachResult: SliceResult;
  results: SliceResult[];
  backbone: Backbone;
  confirmRun: Awaited<ReturnType<typeof runConfirm>> | null;
  confirmModel: string;
}): Verdict {
  const { candidates, overreachResult, results, backbone, confirmRun, confirmModel } = p;
  return {
    contradictions: candidates,
    ruling_issued: overreachResult.rulingIssued,
    notes: buildNotes(results, backbone.discardedTotal, backbone.notes || undefined),
    refuteParsed: backbone.parsed,
    confirm: confirmRun
      ? { ran: true, model: confirmModel, candidates: candidates.length, agreed: confirmRun.agreed.size, parsed: confirmRun.parsed }
      : null,
    ...(backbone.paragraphs ? { paragraphs: backbone.paragraphs } : {}),
  };
}

export type Usage = { input: number; output: number };

export function sumUsage(all: (Usage | null)[]): Usage | null {
  const usages = all.filter((u): u is Usage => u !== null);
  return usages.length
    ? { input: usages.reduce((s, u) => s + u.input, 0), output: usages.reduce((s, u) => s + u.output, 0) }
    : null;
}

function buildNotes(results: SliceResult[], discardedTotal: number, extra?: string): string {
  return [
    ...results.filter((r) => r.notes).map((r) => `${r.slice}: ${r.notes}`),
    extra ?? "",
    discardedTotal ? `${discardedTotal} candidate(s) discarded: span not found` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 600);
}
