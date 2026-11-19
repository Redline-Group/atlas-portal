// What the edit-candidates sweep sends the model: the instructions, and each
// chunk of documents with the neighbours that let a claim be checked against
// its surroundings. `pnpm eval:edit-candidates` measures exactly this text, so
// change it only with a fresh eval run.
import { UUID_LINK_RE } from "../../../scripts/lib/graph-patterns.mjs";
import { CATEGORIES } from "../../lib/potentialMistakesIndex.ts";

export interface SweepDoc {
  id: string;
  doc_no: string;
  title: string;
  type: string;
  content: string;
}

export const SWEEP_SYSTEM = `You review documents of the Sky Atlas, a governance rulebook, for things that need an edit.
Report only what a careful editor would change: typos, grammar slips, wrong words, broken markdown, unfilled placeholders, copy-paste residue, inconsistent naming, numbers or formulas that do not add up, contradictions, wrong entities or addresses, broken cross-references, governance logic that cannot work as written, and dates written as upcoming that are before today's date.
Do not report style preferences, terse wording, or anything you cannot point at in the text. Most documents need no edit; report nothing for them.
Reply with one JSON object: {"findings":[{"uuid","category","severity","quote","issue","fix"}]}.
- uuid: the document's UUID from its header line.
- category: one of ${CATEGORIES.join(", ")}.
- severity: high, medium or low. It is your confidence that this is a real defect.
- quote: text copied character for character from the document, long enough to find.
- issue: one sentence on what is wrong.
- fix: the corrected text, or null when the author must decide.`;

const CONTEXT_HEADER = `##### CONTEXT ONLY
The documents below are neighbours of the ones above: their parents, their siblings and the documents they link to. Read them to check names, figures and references. Report a finding only for a document above this line; when one contradicts a context document, report it on the document above and quote that document's text.`;

export interface SweepIndex {
  byId: Map<string, SweepDoc>;
  byDocNo: Map<string, SweepDoc>;
  /** Parent doc number → its children, in atlas order. */
  children: Map<string, SweepDoc[]>;
}

// Parents come from doc-number arithmetic: parentId stops at the heading depth cap.
const parentNo = (docNo: string): string => docNo.slice(0, Math.max(docNo.lastIndexOf("."), 0));

export function sweepIndex(docs: readonly SweepDoc[]): SweepIndex {
  const children = new Map<string, SweepDoc[]>();
  for (const d of docs) children.set(parentNo(d.doc_no), [...(children.get(parentNo(d.doc_no)) ?? []), d]);
  return { byId: new Map(docs.map((d) => [d.id, d])), byDocNo: new Map(docs.map((d) => [d.doc_no, d])), children };
}

/** Titles of the documents above this one, outermost first. */
export function pathOf(doc: SweepDoc, index: SweepIndex): string[] {
  const out: string[] = [];
  for (let no = parentNo(doc.doc_no); no; no = parentNo(no)) {
    const parent = index.byDocNo.get(no);
    if (parent) out.unshift(parent.title);
  }
  return out;
}

export function renderDoc(doc: SweepDoc, index: SweepIndex, text = doc.content, why = ""): string {
  const head = `=== UUID ${doc.id} | ${pathOf(doc, index).join(" > ")} > ${doc.title} [${doc.type}]`;
  return `${head}\n${why ? `${why}\n` : ""}${text}`;
}

const CONTEXT_DOC_CHARS = 1_200;
const CONTEXT_BYTES_PER_DOC = 6_000;

/** A document's parent, link targets and nearest siblings, within the per-document context budget. */
export function neighbours(doc: SweepDoc, index: SweepIndex): SweepDoc[] {
  const siblings = index.children.get(parentNo(doc.doc_no)) ?? [];
  const at = siblings.indexOf(doc);
  const near = siblings.filter((s) => s !== doc).sort((a, b) => Math.abs(siblings.indexOf(a) - at) - Math.abs(siblings.indexOf(b) - at));
  const cited = [...doc.content.matchAll(UUID_LINK_RE)].map((m) => index.byId.get(m[2].toLowerCase()));
  const parent = index.byDocNo.get(parentNo(doc.doc_no));
  const out = new Set<SweepDoc>();
  let size = 0;
  for (const d of [parent, ...cited, ...near]) {
    if (!d || d === doc || out.has(d)) continue;
    size += Math.min(d.content.length, CONTEXT_DOC_CHARS) + 160;
    if (size > CONTEXT_BYTES_PER_DOC) break;
    out.add(d);
  }
  return [...out];
}

export interface SweepChunk {
  docs: SweepDoc[];
  context: SweepDoc[];
}

/** Queued documents packed in order, each with its unseen neighbours, into chunks of at most `maxBytes`. */
export function packChunks(queue: readonly SweepDoc[], index: SweepIndex, maxBytes = 40_000): SweepChunk[] {
  const chunks: SweepChunk[] = [];
  let size = maxBytes;
  for (const doc of queue) {
    const context = neighbours(doc, index);
    const cost = doc.content.length + 200 + context.reduce((n, d) => n + Math.min(d.content.length, CONTEXT_DOC_CHARS) + 160, 0);
    if (size + cost > maxBytes) {
      chunks.push({ docs: [], context: [] });
      size = 0;
    }
    const chunk = chunks.at(-1)!;
    chunk.docs.push(doc);
    chunk.context.push(...context.filter((d) => !chunk.context.includes(d)));
    size += cost;
  }
  // A queued document is never also context: its own entry carries the whole text.
  for (const c of chunks) c.context = c.context.filter((d) => !c.docs.includes(d));
  return chunks;
}

const clip = (text: string): string => (text.length > CONTEXT_DOC_CHARS ? `${text.slice(0, CONTEXT_DOC_CHARS)} […]` : text);

/** The user message for one chunk. `why` holds a line per document re-read because of a neighbour. */
export function chunkMessage(chunk: SweepChunk, index: SweepIndex, today: string, why: Record<string, string> = {}): string {
  const docs = chunk.docs.map((d) => renderDoc(d, index, d.content, why[d.id])).join("\n\n");
  const context = chunk.context.map((d) => renderDoc(d, index, clip(d.content))).join("\n\n");
  return `Today's date is ${today}.\n\n${docs}${context ? `\n\n${CONTEXT_HEADER}\n\n${context}` : ""}`;
}
