/**
 * Attributes each changed document of a PR to the PR-body bullet that
 * describes it. Scoring and tokenising are history-classify.ts.
 *
 * Nothing in this module performs I/O.
 */

import { DOC_NO_RE, UUID_RE, matchScore, nodeTokenSets, type PrBullet } from "./history-classify.ts";

export interface BulletMatch {
  bulletTitle: string;
  bulletDescription?: string;
  matchScore: number;
  /** How the bullet was tied to the document. */
  via: "ref" | "fuzzy" | "sole-bullet";
}

type Refs = { docNos: Set<string>; uuids: Set<string> };
type ChangedNode = { id: string; doc_no: string; title?: string };
type ScopedBullet = { bullet: PrBullet; refs: Refs; agentScope: string[] };
type Snapshot = Map<string, { doc_no: string; title?: string }>;

export interface MatchOpts {
  /** Refs harvested from anywhere in a Discourse post, attributed to refFallback. */
  extraRefs?: Refs;
  refFallback?: PrBullet;
  agentNamePrefixes?: [string, string][];
}

/** Pull doc_nos and UUIDs from a bullet's text. */
export function explicitRefs(bullet: PrBullet): Refs {
  const text = `${bullet.title}\n${bullet.description ?? ""}`;
  return {
    docNos: new Set(text.match(DOC_NO_RE) ?? []),
    uuids: new Set(text.match(UUID_RE) ?? []),
  };
}

/** True iff nodeDocNo is the same as or a descendant of any ref. */
export function nodeInRefScope(nodeDocNo: string, refDocNos: Iterable<string>): boolean {
  for (const ref of refDocNos) {
    if (nodeDocNo === ref || nodeDocNo.startsWith(ref + ".")) return true;
  }
  return false;
}

/** Doc_no prefixes for any prime-agent name appearing in the bullet title
 *  as a word-boundary substring. Title-only because descriptions often
 *  mention many agents in passing. */
export function detectAgentScope(bulletTitle: string, agentNamePrefixes: [string, string][]): string[] {
  const lc = String(bulletTitle ?? "").toLowerCase();
  const scopes = [];
  for (const [name, prefix] of agentNamePrefixes) {
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lc)) scopes.push(prefix);
  }
  return scopes;
}

const names = (refs: Refs, node: ChangedNode) => refs.docNos.has(node.doc_no) || refs.uuids.has(node.id);

const matchOf = (bullet: PrBullet, score: number, via: BulletMatch["via"]): BulletMatch => ({
  bulletTitle: bullet.title,
  bulletDescription: bullet.description,
  matchScore: Math.round(score * 100),
  via,
});

const scopeBullet = (bullet: PrBullet, prefixes: MatchOpts["agentNamePrefixes"]): ScopedBullet => ({
  bullet,
  refs: explicitRefs(bullet),
  agentScope: prefixes ? detectAgentScope(bullet.title, prefixes) : [],
});

/** Passes 1a and 1b: the first bullet naming the node, else the forum fallback. */
function refMatch(node: ChangedNode, scoped: ScopedBullet[], opts: MatchOpts): PrBullet | null {
  for (const { bullet, refs } of scoped) if (names(refs, node)) return bullet;
  if (opts.extraRefs && opts.refFallback && names(opts.extraRefs, node)) return opts.refFallback;
  return null;
}

/** Pass 2: the best-scoring bullet whose ref and agent scopes admit the node. */
function fuzzyMatch(node: ChangedNode, scoped: ScopedBullet[], byDocNo: Snapshot): BulletMatch | null {
  const { own, ancestors } = nodeTokenSets(node, byDocNo);
  let bestBullet: PrBullet | null = null;
  let bestScore = 0;
  for (const { bullet, refs, agentScope } of scoped) {
    if (refs.docNos.size > 0 && !nodeInRefScope(node.doc_no, refs.docNos)) continue;
    if (agentScope.length > 0 && !nodeInRefScope(node.doc_no, new Set(agentScope))) continue;
    const score = matchScore(bullet, own, ancestors);
    if (score > bestScore) {
      bestScore = score;
      bestBullet = bullet;
    }
  }
  return bestBullet && bestScore >= 0.35 ? matchOf(bestBullet, bestScore, "fuzzy") : null;
}

/** For each changed node, find the best-matching bullet (if any).
 *
 *  Passes:
 *    1a. Deterministic — bullet text contains node's doc_no or UUID.
 *    1b. Forum extraRefs — refs harvested from anywhere in a Discourse post,
 *        attributed to refFallback (SAEP Summary).
 *    2.  Fuzzy — own-title + ancestor token overlap, with scope restrictions
 *        (explicit refs + agent-name scope) to suppress cross-agent vocab
 *        collisions.
 *    3.  Sole-bullet fallback — 1-bullet PR? attach to all unmatched nodes. */
export function matchBulletsToNodes(
  bullets: PrBullet[],
  changedNodes: ChangedNode[],
  snapshot: Snapshot,
  opts: MatchOpts = {},
): Map<string, BulletMatch> {
  const matches = new Map<string, BulletMatch>();
  if (bullets.length === 0) return matches;
  const byDocNo: Snapshot = new Map();
  for (const entry of snapshot.values()) byDocNo.set(entry.doc_no, entry);
  const scoped = bullets.map((b) => scopeBullet(b, opts.agentNamePrefixes));
  for (const node of changedNodes) {
    const byRef = refMatch(node, scoped, opts);
    const match = byRef ? matchOf(byRef, 1, "ref") : fuzzyMatch(node, scoped, byDocNo);
    if (match) matches.set(node.id, match);
  }
  // Sole-bullet fallback (SAEP-style): one bullet covers the whole PR.
  if (bullets.length === 1) {
    for (const node of changedNodes) if (!matches.has(node.id)) matches.set(node.id, matchOf(bullets[0], 0, "sole-bullet"));
  }
  return matches;
}
