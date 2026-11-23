// Per-case readings of the two deterministic signals the passes share — ordered containment
// and structural position — plus the document-order comparator. Pure: reads the queue only.

import { bestByContainment } from "../../lib/ordered-containment.mjs";
import { positionalPick } from "./rules.ts";
import type { Case, CurationData } from "./types.ts";

// candidate keys (content) for a case, in display/score order — used by containment.
const candContents = (data: CurationData, kase: Case) =>
  (kase.candidates || []).map((c) => ({ key: c.key, content: data.nodes[c.key]?.content ?? "" })).filter((c) => c.content);

// The containment best for a case, with its score and margin over the runner-up.
export const containmentBest = (data: CurationData, kase: Case) =>
  bestByContainment(data.nodes[kase.subjectKey]?.content ?? "", candContents(data, kase));

export function containBestKey(data: CurationData, kase: Case): string | null {
  if (!kase.candidates?.length) return null;
  return containmentBest(data, kase).best?.key ?? null;
}

// The margin-gated positional pick over a case's candidates, or null when it abstains.
export const positionalPickFor = (data: CurationData, kase: Case) =>
  positionalPick(data.nodes[kase.subjectKey], (kase.candidates || []).map((c) => c.key), data.nodes);

// Document order of the newer docs, ties broken by case key.
export const bySubjectOrder = (a: Case, b: Case) =>
  (a.subjectOrder ?? 0) - (b.subjectOrder ?? 0) || a.key.localeCompare(b.key);
