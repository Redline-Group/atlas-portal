/**
 * Pure heuristics used by build-history.mjs to classify each per-doc change
 * and score it against a PR bullet (history-bullet-match.ts picks the bullet).
 * The preview server reads the same diff classifier through
 * history-events.ts, so a branch commit and a live one are labelled lint /
 * typo / semantic alike.
 *
 * Nothing in this module performs I/O.
 */

import type { DiffLine } from "../../src/lib/history.ts";

export interface PrBullet {
  title: string;
  description?: string;
}

// ─────────────────────────── tokenisation ──────────────────────────────

const STOP = new Set([
  "the","a","an","and","or","for","in","on","to","at","by","with","from","of","is","as",
]);

/** Lowercase + alphanumeric-split, drop stop words and tokens ≤2 chars. */
export function tokenize(s: unknown): string[] {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

// ─────────────────────────── regexes ───────────────────────────────────

// Doc_no shape (e.g. "A.6.1.1.3.2.1", "A.1.6.var1").
export const DOC_NO_RE = /\b[A-Z](?:\.\w+)+/g;
export const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g;

// PR-title intent → kind. Lint and typo titles override per-diff
// classification so e.g. "fix typos" cascades read as typo regardless of
// individual diff size.
export const PR_LINT_RE =
  /\b(?:whitespace|non[\s-]?breaking|formatt?ing|lint(?:er|ing)?|cleanup\s+formatting|remove\s+formatting)\b/i;
export const PR_TYPO_RE =
  /\b(?:fix(?:es|ed|ing)?\s+(?:a\s+)?(?:typos?|spelling)|(?:typos?|spelling)\s+fix(?:es)?|correct\s+(?:typos?|spelling))\b/i;

// Boilerplate scrubbed from descriptions before the actor-history italic
// block renders. Match one boilerplate sentence; cleanDescription drops the
// whole field when residue is <10 chars (or is just a bare URL).
export const BOILERPLATE_RE: RegExp[] = [
  /\*{0,2}[^.\n\r]*\b(?:poll passes|associated poll|merged until|cannot be merged|may only be merged|will not be merged)\b[^.\n\r]*[.!?]?\s*\*{0,2}/gi,
  /\*{0,2}\s*Do not (?:merge|post)[^.\n\r]*\*{0,2}/gi,
  /\*{0,2}\s*Originating forum post:?\s*<?\S*>?\s*\*{0,2}/gi,
];

// ─────────────────────────── classifiers ───────────────────────────────

/** Strip merge-gate boilerplate + bare-URL noise. Returns null when the
 *  cleaned residue is too short to be informative. */
export function cleanDescription(s: string | null | undefined): string | null {
  if (!s) return null;
  let out = String(s);
  for (const re of BOILERPLATE_RE) out = out.replace(re, " ");
  out = out
    .replace(/\s+/g, " ")
    .replace(/^[\s\-—*•·:]+|[\s\-—*•·:]+$/g, "")
    .trim();
  if (/^https?:\/\/\S+$/.test(out)) return null;
  return out.length >= 10 ? out : null;
}

/** PR-title → "lint" | "typo" | null. Title-only — does not consult body. */
export function classifyPrTitle(prTitle: string | null | undefined): "lint" | "typo" | null {
  if (!prTitle) return null;
  if (PR_LINT_RE.test(prTitle)) return "lint";
  if (PR_TYPO_RE.test(prTitle)) return "typo";
  return null;
}

/** Walk a line/word diff and classify the edit:
 *    "lint"     — added/removed text is entirely whitespace or punctuation
 *    "typo"     — ≤4 alphanumeric chars changed AND no contiguous run >2
 *    "semantic" — anything else
 *    null       — no diff data (empty array)
 *  See classifyPrTitle for the override that runs before this. */
export function classifyDiff(diff: DiffLine[] | null | undefined): "lint" | "typo" | "semantic" | null {
  if (!diff || diff.length === 0) return null;
  const tally: DiffTally = { semChars: 0, wsChars: 0, maxRun: 0 };
  for (const op of diff) tallyOp(tally, op);
  if (tally.semChars === 0) return tally.wsChars > 0 ? "lint" : null;
  if (tally.semChars <= 4 && tally.maxRun <= 2) return "typo";
  return "semantic";
}

/** Changed characters of a diff: alphanumeric, everything else, and the longest alphanumeric run. */
interface DiffTally { semChars: number; wsChars: number; maxRun: number }

function tallyText(tally: DiffTally, text: unknown): void {
  const t = String(text ?? "");
  for (const chunk of t.split(/[^a-zA-Z0-9]+/)) {
    if (!chunk) continue;
    tally.semChars += chunk.length;
    if (chunk.length > tally.maxRun) tally.maxRun = chunk.length;
  }
  tally.wsChars += t.replace(/[a-zA-Z0-9]+/g, "").length;
}

function tallyOp(tally: DiffTally, op: DiffLine): void {
  const head = op[0];
  if (head === "=" || head === "…") return;
  if (head === "+" || head === "-") tallyText(tally, op[1]);
  else if (head === "~") {
    for (const inner of op[1] ?? []) {
      if (inner[0] === "=") continue;
      tallyText(tally, inner[1]);
    }
  }
}

// ─────────────────────────── bullet matcher ────────────────────────────

/** Parse `- **Bold Title** — description` PR-style bullets out of a body. */
export function parsePrBullets(body: string | null | undefined): PrBullet[] {
  const bullets: PrBullet[] = [];
  const re = /^[-*]\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body ?? "")) !== null) {
    bullets.push({ title: m[1].trim(), description: m[2].trim() });
  }
  return bullets;
}

/** Strip the last dotted segment of a doc_no; null for single-segment. */
export function parentDocNo(doc_no: string): string | null {
  const idx = String(doc_no).lastIndexOf(".");
  return idx > 0 ? doc_no.slice(0, idx) : null;
}

/** How many ancestors to walk for context tokens, indexed by the node's
 *  doc_no segment count. Shallow docs walk 1 (already specific); deep docs
 *  walk up to 6 (their own title is generic so they need ancestor context). */
export function ancestorWalkFor(docNoDepth: number): number {
  if (docNoDepth <= 3) return 1;
  if (docNoDepth === 4) return 2;
  if (docNoDepth === 5) return 3;
  if (docNoDepth === 6) return 3;
  if (docNoDepth === 7) return 4;
  if (docNoDepth === 8) return 5;
  return 6;
}

/** own = tokens of the node's title; ancestors = title tokens of its
 *  walked-up parents (excluding own tokens to avoid double-counting). */
export function nodeTokenSets(
  node: { doc_no: string; title?: string },
  snapshotByDocNo: Map<string, { title?: string }>,
): { own: Set<string>; ancestors: Set<string> } {
  const own = new Set(tokenize(node.title));
  const ancestors = new Set<string>();
  const depth = String(node.doc_no).split(".").length;
  const walk = ancestorWalkFor(depth);
  let cur: string | null = node.doc_no;
  for (let i = 0; i < walk; i++) {
    cur = parentDocNo(cur);
    if (!cur) break;
    const ancestor = snapshotByDocNo.get(cur);
    if (ancestor) for (const t of tokenize(ancestor.title)) if (!own.has(t)) ancestors.add(t);
  }
  return { own, ancestors };
}

/** Score: own-token hits in (title|description) + ancestor-token hits in
 *  title only, all over own.size, capped at 1.0. Reject single-description-
 *  hit matches (the generic-vocab false-positive class — see Launch Agent 7
 *  / Skybase case): require ≥1 own-in-title, or ≥2 own-total, or ≥2 anc. */
export function matchScore(bullet: PrBullet, ownTokens: Set<string>, ancestorTokens: Set<string>): number {
  if (ownTokens.size === 0) return 0;
  const titleTokens = new Set(tokenize(bullet.title));
  const descTokens = new Set(tokenize(bullet.description ?? ""));
  if (titleTokens.size === 0 && descTokens.size === 0) return 0;
  let ownTitleHits = 0;
  let ownTotalHits = 0;
  for (const t of ownTokens) {
    const inTitle = titleTokens.has(t);
    if (inTitle) ownTitleHits++;
    if (inTitle || descTokens.has(t)) ownTotalHits++;
  }
  let ancHits = 0;
  for (const t of ancestorTokens) if (titleTokens.has(t)) ancHits++;
  if (ownTitleHits === 0 && ownTotalHits < 2 && ancHits < 2) return 0;
  return Math.min(1, (ownTotalHits + ancHits) / ownTokens.size);
}
