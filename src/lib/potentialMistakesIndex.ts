// Edit Candidates — things in the Atlas source text that may need an update.
//
// The text-sweep rows are an LLM reading of the atlas: the atlas worker sweeps
// new and changed documents and serves the rows from GET /api/edit-candidates,
// with public/potential-mistakes.json as the committed seed and fallback. A
// row therefore describes a document as it stood when it was swept, so each
// row's relationship to the atlas being served is recomputed client-side (see
// resolveFindings): a finding whose UUID is absent from the served atlas, or
// whose doc carries a different number there, is flagged rather than shown as
// if still current.
// Rows from the other sources (editCandidates/) are computed live.
//
// Findings describe what the atlas SAYS; they are SAbR's reading of it, not
// atlas text. Every row carries its own doc_no + UUID + atlas link so each
// claim is checkable against the source in context.

import type { AtlasNode } from "../types";
import { NO_OWNER, type Ownership } from "./mistakeOwnership";
import { quoteInDoc } from "./mistakeQuote";
import type { SearchField } from "./reportFilter";

export type MistakeSeverity = "high" | "medium" | "low";
export type MistakePass = "language" | "factual" | "deterministic";

/** One finding, exactly as stored in public/potential-mistakes.json. */
export interface Mistake {
  id: string;
  docNo: string;
  /** null for a corpus-wide finding that spans documents (no single target). */
  uuid: string | null;
  file: string;
  category: string;
  severity: MistakeSeverity;
  pass: MistakePass;
  quote: string;
  issue: string;
  /** null when the finding needs an author decision rather than a known edit. */
  fix: string | null;
  /** YYYY-MM-DD the candidate was first found; absent when nobody recorded it. */
  firstSeen?: string;
}

/** A finding a review read against the source and ruled out. */
export interface RejectedMistake extends Mistake {
  /** One line on why it is not a real defect. */
  rejectedReason: string;
  /** YYYY-MM-DD the veto was recorded. */
  rejectedOn: string;
  /** Repo path of the review that carries the full reasoning. */
  rejectedIn: string;
  /**
   * Who decided the veto: a person, or an AI reviewer whose verdict no person
   * has confirmed. An `ai-review` veto suppresses re-adds like any other, so it
   * stays open to audit: a person confirms it (→ `human`) or moves the row back
   * to `findings`. Absent on vetoes recorded before the field existed.
   */
  rejectedBy?: "human" | "ai-review";
}

export interface MistakesFile {
  generatedAt: string;
  atlasSha: string;
  documentsScanned: number;
  note: string;
  passes: Record<MistakePass, string>;
  findings: Mistake[];
  /**
   * Findings reviewed and rejected. Held OUT of `findings` so the report never
   * shows them, and held IN this file so a later sweep cannot quietly re-add
   * them: `suppressRejected` (scripts/lib/mistakes-sweep.mjs) drops an incoming
   * row that repeats a rejected (uuid, category, quote) before `mergeFindings`
   * ever sees it. The veto lapses if the quoted text itself changes, which is
   * the point at which a human should look again.
   */
  rejected?: RejectedMistake[];
}

/** How a stored finding lines up with the atlas currently being served. */
export type MistakeStatus =
  | "current" // quote still in the doc, at the recorded doc_no
  | "renumbered" // quote still in the doc, but its doc_no changed since the sweep
  | "fixed" // doc still exists, but the quote is gone from it — likely fixed upstream
  | "missing" // UUID no longer in the atlas — doc deleted, or the finding is stale
  | "corpus"; // finding spans documents; nothing single to resolve

/** Ownership fields (mistakeOwnership.ts) are all "" when the doc is unresolvable. */
export interface MistakeRow extends Mistake, Ownership {
  status: MistakeStatus;
  /** Live doc_no when resolvable, else "". Differs from docNo when renumbered. */
  currentDocNo: string;
  /** Live title when resolvable, else "". */
  title: string;
  /** Id of the source that produced the row (editCandidates/sourceMeta.ts). */
  source: string;
  sourceLabel: string;
  /** In-app path of the report holding the row's full detail, or "". */
  detailHref: string;
  /** YYYY-MM-DD the candidate was first found, or "" when unknown. */
  found: string;
  /** YYYY-MM-DD the document last changed in the Atlas, or "" when unknown. */
  docChanged: string;
}

/** The text sweep's identity on a row; the other sources are in editCandidates/. */
export const SWEEP_SOURCE = { source: "sweep", sourceLabel: "Text sweep", detailHref: "" } as const;

export const SEVERITIES: readonly MistakeSeverity[] = ["high", "medium", "low"];
export const PASSES: readonly MistakePass[] = ["language", "factual", "deterministic"];

// Display order is roughly "most substantive first" — a wrong number or a
// wrong address matters more than a missing comma.
export const CATEGORIES = [
  "numeric",
  "entity",
  "governance",
  "contradiction",
  "structural",
  "xref",
  "stale",
  "placeholder",
  "copy-paste",
  "wrong-word",
  "typo",
  "grammar",
  "markdown",
  "naming",
  "duplication",
] as const;

// Categories only a derived source assigns. Kept apart from CATEGORIES, which
// is the list the sweep may report and is held equal to the sweep script's.
export const DERIVED_CATEGORIES = ["onchain"] as const;
const DISPLAY_CATEGORIES: readonly string[] = [...DERIVED_CATEGORIES, ...CATEGORIES];

export const CATEGORY_LABELS: Record<string, string> = {
  numeric: "Numeric / formula",
  entity: "Wrong entity or address",
  governance: "Governance logic",
  contradiction: "Contradiction",
  structural: "Structural",
  xref: "Broken cross-reference",
  stale: "Stale / dated",
  placeholder: "Unfilled placeholder",
  "copy-paste": "Copy-paste residue",
  "wrong-word": "Wrong word",
  typo: "Typo / spelling",
  grammar: "Grammar",
  markdown: "Broken markdown",
  naming: "Naming inconsistency",
  duplication: "Duplication",
};

/** Every label a row can carry: the sweep's (CATEGORY_LABELS) and the derived sources'. */
export const DISPLAY_CATEGORY_LABELS: Record<string, string> = { onchain: "Atlas vs chain", ...CATEGORY_LABELS };

export const PASS_LABELS: Record<MistakePass, string> = {
  language: "Language",
  factual: "Factual",
  deterministic: "Mechanical",
};

export const STATUS_LABELS: Record<MistakeStatus, string> = {
  current: "Quote still in doc",
  renumbered: "Renumbered since sweep",
  fixed: "Quote no longer in doc",
  missing: "Doc no longer in atlas",
  corpus: "Spans documents",
};

/**
 * Joins findings to the atlas currently being served, in their given order.
 * This is what stops a stored row from presenting a finding about a document
 * that has since moved or gone, or whose quoted text has since been rewritten
 * (mistakeQuote.ts).
 */
export function resolveFindings(
  findings: readonly Mistake[],
  docs: Record<string, AtlasNode>,
  owner: (uuid: string) => Ownership = () => NO_OWNER,
): MistakeRow[] {
  const base = (f: Mistake) => ({ ...f, ...SWEEP_SOURCE, found: f.firstSeen ?? "", docChanged: "" });
  return findings.map((f): MistakeRow => {
    if (!f.uuid) return { ...base(f), ...NO_OWNER, status: "corpus", currentDocNo: "", title: "" };
    const doc = docs[f.uuid];
    if (!doc) return { ...base(f), ...NO_OWNER, status: "missing", currentDocNo: "", title: "" };
    return {
      ...base(f),
      ...owner(f.uuid),
      status: !quoteInDoc(f.quote, f.docNo, doc) ? "fixed" : doc.doc_no === f.docNo ? "current" : "renumbered",
      currentDocNo: doc.doc_no,
      title: doc.title,
    };
  });
}

/** The text sweep's rows alone, joined and sorted. */
export function resolveMistakes(
  file: MistakesFile,
  docs: Record<string, AtlasNode>,
  owner: (uuid: string) => Ownership = () => NO_OWNER,
): MistakeRow[] {
  return sortMistakes(resolveFindings(file.findings, docs, owner));
}

const SEV_RANK: Record<MistakeSeverity, number> = { high: 0, medium: 1, low: 2 };

/** Deterministic order: severity, then doc_no numerically, then id. */
export function sortMistakes(rows: readonly MistakeRow[]): MistakeRow[] {
  return [...rows].sort(
    (a, b) =>
      SEV_RANK[a.severity] - SEV_RANK[b.severity] ||
      a.docNo.localeCompare(b.docNo, undefined, { numeric: true }) ||
      a.id.localeCompare(b.id),
  );
}

/** Header-box text filter: doc number (recorded AND current), title, the
 *  quoted atlas text, our description, the suggested fix, and the category /
 *  pass labels so "grammar" or "factual" narrow the table too. */
export function mistakeSearchFields(r: MistakeRow): SearchField[] {
  return [
    { label: "doc no", value: r.docNo },
    { label: "current doc no", value: r.currentDocNo, hidden: true },
    { label: "title", value: r.title },
    { label: "quote", value: r.quote },
    { label: "issue", value: r.issue },
    { label: "fix", value: r.fix ?? "" },
    { label: "category", value: DISPLAY_CATEGORY_LABELS[r.category] ?? r.category, hidden: true },
    { label: "pass", value: PASS_LABELS[r.pass], hidden: true },
    { label: "file", value: r.file, hidden: true },
    { label: "scope", value: r.scopeLabel, hidden: true },
    { label: "agent", value: r.agent, hidden: true },
    { label: "executor", value: r.executorLabel, hidden: true },
    { label: "source", value: r.sourceLabel, hidden: true },
  ];
}

export const MISTAKE_SEARCHES =
  "doc no · title · quoted atlas text · issue · suggested fix · category · pass · source · scope · agent · executor agent";

/** Per-bucket counts for the filter pills. */
export function countBy<K extends string>(rows: readonly MistakeRow[], key: (r: MistakeRow) => K): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const r of rows) out[key(r)] = (out[key(r)] ?? 0) + 1;
  return out;
}

/** Categories present in the data, in CATEGORIES display order (unknown keys last). */
export function presentCategories(rows: readonly MistakeRow[]): string[] {
  const seen = new Set(rows.map((r) => r.category));
  const known = DISPLAY_CATEGORIES.filter((c) => seen.has(c));
  const extra = [...seen].filter((c) => !DISPLAY_CATEGORIES.includes(c)).sort();
  return [...known, ...extra];
}
