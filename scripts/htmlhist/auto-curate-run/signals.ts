import { bestByContainment } from "../../lib/ordered-containment.mjs";
import { positionalPick } from "./rules.ts";
import type { Case, CurationData } from "./types.ts";

const candContents = (data: CurationData, kase: Case) =>
  (kase.candidates || []).map((c) => ({ key: c.key, content: data.nodes[c.key]?.content ?? "" })).filter((c) => c.content);

export const containmentBest = (data: CurationData, kase: Case) =>
  bestByContainment(data.nodes[kase.subjectKey]?.content ?? "", candContents(data, kase));

export function containBestKey(data: CurationData, kase: Case): string | null {
  if (!kase.candidates?.length) return null;
  return containmentBest(data, kase).best?.key ?? null;
}

export const positionalPickFor = (data: CurationData, kase: Case) =>
  positionalPick(data.nodes[kase.subjectKey], (kase.candidates || []).map((c) => c.key), data.nodes);

export const bySubjectOrder = (a: Case, b: Case) =>
  (a.subjectOrder ?? 0) - (b.subjectOrder ?? 0) || a.key.localeCompare(b.key);
