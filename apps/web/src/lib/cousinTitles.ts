import type { AtlasNode } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import { pushTo } from "@/lib/collections";
import { contradicts, pathMarks, sharedRun } from "./cousinPaths";

type Atlas = Pick<AtlasBundle, "docs" | "docNoToId">;
type Docs = Record<string, AtlasNode>;

// fragile: doc_no prefix — Prime Agent artifact roots, A.6.1.1.<n>
const PRIME_ROOT_RE = /^A\.6\.1\.1\.(\d+)$/;
const AGENT = "#";

/** Each Prime Agent artifact root, by its number under A.6.1.1. */
const primeRootsCache = new WeakMap<Docs, Map<string, AtlasNode>>();
export function primeRoots(docs: Docs): Map<string, AtlasNode> {
  let roots = primeRootsCache.get(docs);
  if (roots) return roots;
  roots = new Map();
  for (const d of Object.values(docs)) {
    const m = PRIME_ROOT_RE.exec(d.doc_no);
    if (m) roots.set(m[1], d);
  }
  primeRootsCache.set(docs, roots);
  return roots;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Any Prime Agent's name as a whole word, longest name first so a name never
// loses to a shorter one it contains.
const agentReCache = new WeakMap<Docs, RegExp | null>();
function agentRe(docs: Docs): RegExp | null {
  if (agentReCache.has(docs)) return agentReCache.get(docs)!;
  const names = [...primeRoots(docs).values()].map((d) => d.title.trim()).filter(Boolean);
  const alt = names.sort((a, b) => b.length - a.length).map(escapeRe).join("|");
  const re = alt ? new RegExp(`\\b(?:${alt})\\b`, "gi") : null;
  agentReCache.set(docs, re);
  return re;
}

const maskAgents = (docs: Docs, title: string | undefined): string => {
  const t = (title ?? "").toLowerCase();
  const re = agentRe(docs);
  return re ? t.replace(re, ` ${AGENT} `) : t;
};

// How titles compare for cousins: case, spacing and punctuation ignored, and any
// Prime Agent's name stands for "the agent", so "Spark Liquidity Layer Addresses"
// meets "Grove Liquidity Layer Addresses" and "Rate Limit ID" meets "RateLimitID".
export function titleKeyer(docs: Docs): (title: string | undefined) => string {
  return (title) => maskAgents(docs, title).replace(/[^a-z0-9#]/g, "");
}

/** A title's words, lowercased, with any Prime Agent's name as one shared word. */
export function titleWords(docs: Docs, title: string | undefined): Set<string> {
  return new Set(maskAgents(docs, title).split(/[^a-z0-9#]+/).filter(Boolean));
}

// Title key → docs, built once per atlas load; the annotations memo re-runs
// cousin lookup on every navigation.
const titleIndexCache = new WeakMap<Docs, Map<string, AtlasNode[]>>();
export function titleIndex(docs: Docs): Map<string, AtlasNode[]> {
  let idx = titleIndexCache.get(docs);
  if (idx) return idx;
  const key = titleKeyer(docs);
  idx = new Map();
  for (const d of Object.values(docs)) {
    const k = key(d.title);
    if (k) pushTo(idx, k, d);
  }
  titleIndexCache.set(docs, idx);
  return idx;
}

export const parentDocNo = (docNo: string): string => docNo.slice(0, docNo.lastIndexOf("."));

export function titleAt(atlas: Atlas, docNo: string): string | undefined {
  const id = atlas.docNoToId.get(docNo);
  return id ? atlas.docs[id]?.title : undefined;
}

const ICD_TITLE_RE = /instance configuration document$/i;

/** Whether `doc` sits inside an instance's ICD somewhere below `root`. */
export function insideIcdBelow(atlas: Atlas, doc: AtlasNode, root: AtlasNode): boolean {
  for (let no = doc.doc_no; no.length > root.doc_no.length; no = parentDocNo(no)) {
    if (ICD_TITLE_RE.test((titleAt(atlas, no) ?? "").trim())) return true;
  }
  return false;
}

// Titles of the headings between `doc` and `root`, nearest first; a child of
// `root` has none, so two children of their roots always agree.
function headings(atlas: Atlas, doc: AtlasNode, rootDocNo: string): string[] {
  const out: string[] = [];
  for (let no = parentDocNo(doc.doc_no); no.length > rootDocNo.length; no = parentDocNo(no)) out.push(titleAt(atlas, no) ?? "");
  return out;
}

// The doc under `root` that plays the target's part: the same title key under a
// parent with the same title key (headings that only name a chain set aside), on
// a path that names no other chain or status (cousinPaths.ts).
// ICDs of one primitive are not laid out identically, so the doc_no suffix is only
// a tie-break, after the longest run of matching headings; no doc is better than
// one in another heading's place. `accept` narrows the candidates.
export function equivalentDoc(
  atlas: Atlas,
  target: AtlasNode,
  relSuffix: string,
  root: AtlasNode,
  accept: (doc: AtlasNode) => boolean = () => true,
): AtlasNode | undefined {
  if (!relSuffix) return root;
  const key = titleKeyer(atlas.docs);
  const want = pathMarks(headings(atlas, target, target.doc_no.slice(0, -relSuffix.length)), key);
  const runOf = new Map<AtlasNode, number>();
  for (const d of titleIndex(atlas.docs).get(key(target.title)) ?? []) {
    if (!d.doc_no.startsWith(`${root.doc_no}.`) || !accept(d)) continue;
    const got = pathMarks(headings(atlas, d, root.doc_no), key);
    if ((got.steps[0] ?? "") !== (want.steps[0] ?? "") || contradicts(want, got)) continue;
    runOf.set(d, sharedRun(got.steps, want.steps));
  }
  const best = Math.max(-1, ...runOf.values());
  const top = [...runOf].filter(([, r]) => r === best).map(([d]) => d);
  if (top.length <= 1) return top[0];
  return top.find((d) => d.doc_no === `${root.doc_no}${relSuffix}`);
}
