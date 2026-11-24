import type { AtlasNode } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import { pushTo } from "@/lib/collections";

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

// The doc under `root` that plays the target's part. ICDs of one primitive are
// not laid out identically, so the target's doc_no suffix is only a first guess:
// the match is by title key, with the parent's title breaking a tie, and no doc
// is better than a doc with a different title.
export function equivalentDoc(atlas: Atlas, target: AtlasNode, relSuffix: string, root: AtlasNode): AtlasNode | undefined {
  if (!relSuffix) return root;
  const key = titleKeyer(atlas.docs);
  const title = key(target.title);
  const alignedId = atlas.docNoToId.get(`${root.doc_no}${relSuffix}`);
  const aligned = alignedId ? atlas.docs[alignedId] : undefined;
  if (aligned && key(aligned.title) === title) return aligned;
  const same = (titleIndex(atlas.docs).get(title) ?? []).filter((d) => d.doc_no.startsWith(`${root.doc_no}.`));
  if (same.length <= 1) return same[0];
  const parentTitle = key(titleAt(atlas, parentDocNo(target.doc_no)));
  const byParent = same.filter((d) => key(titleAt(atlas, parentDocNo(d.doc_no))) === parentTitle);
  return byParent.length === 1 ? byParent[0] : undefined;
}
