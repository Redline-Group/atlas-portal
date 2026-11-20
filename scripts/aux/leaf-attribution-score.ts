// The attribution methods leaf-attribution-experiment.ts compares, each
// answering "which member of the group does this query want?" for one case.
import type { AtlasNode } from "../../src/types.ts";
import { pickLeaf, leafScore } from "../../src/server/retrieval/embed-units.ts";
import { contentHash } from "../../src/server/retrieval/embed-text.ts";
import { embedQuery } from "../../src/server/retrieval/embed.ts";
import type { Case, DocsById, VectorCache, anchorPoolOf } from "./leaf-attribution-data.ts";
import { residualQuery } from "../../src/server/retrieval/leaf-scores.ts";
import { rrfFuse } from "../../src/lib/searchSemantic.ts";
import { dot } from "../eval/eval-retrieval-rank.ts";
import { argmaxMember, withoutDirection } from "./leaf-attribution-vectors.ts";

type AnchorPool = ReturnType<typeof anchorPoolOf>;
type VecOf = (n: AtlasNode) => number[] | undefined;
export interface ScoreContext {
  byId: DocsById;
  cache: VectorCache;
  anchorPool: AnchorPool;
}

export const METHODS = ["lex", "cos", "rrf", "res", "prj", "mpj"] as const;
/** The member each method picks, the shared-residual pick per K, and whether the target has a vector at all. */
export type Picks = Record<(typeof METHODS)[number], string> & { shared: Map<number, string>; available: boolean };

// Fuse the two by reciprocal rank, with the fusion search already uses for its
// lexical and semantic legs (rrfFuse). Lexical and cosine fail on DIFFERENT slices —
// lexical wins icd-param 43/15, cosine wins kv-record 61/22 — so a rank fusion should
// beat either alone if the failures really are complementary.
export const K_VALUES = [1, 5, 10, 20, 50];

function rrfPick(query: string, members: AtlasNode[], vecOf: VecOf, qv: number[], fallback: string): string {
  const scored = members.map((m) => {
    const v = vecOf(m);
    return { id: m.id, lex: leafScore(query, m), cos: v ? dot(qv, v) : -Infinity };
  });
  const idsBy = (key: "lex" | "cos") => [...scored].sort((x, y) => y[key] - x[key]).map((x) => x.id);
  const fused = rrfFuse([idsBy("lex"), idsBy("cos")]);
  let rrfPick = fallback;
  let rrfBest = -Infinity;
  for (const x of scored) {
    const f = fused.get(x.id)!;
    if (f > rrfBest) {
      rrfBest = f;
      rrfPick = x.id;
    }
  }
  return rrfPick;
}

// ── ONE residual per query, built from the TOP-K RETRIEVED anchors ──
// The per-anchor residual needs an embed per grouped hit. A single shared
// residual costs one embed per query regardless of hit count — but it must be built
// from what retrieval actually returns, not from the known-correct anchor, and
// stripping the union of several anchor titles risks removing question words too.
// Anchors are ranked here by cosine to the query, which is what the semantic leg
// returns, so the simulation is faithful rather than optimistic.
async function sharedPicks(query: string, members: AtlasNode[], vecOf: VecOf, qv: number[], pool: AnchorPool, fallback: string) {
  const ranked = pool.map((a) => ({ a, s: dot(qv, a.vec) })).sort((x, y) => y.s - x.s);
  const picks = new Map<number, string>();
  for (const k of K_VALUES) {
    // Strip the union of the top-K retrieved anchor titles, once.
    const sv = await embedQuery(residualQuery(query, ranked.slice(0, k).map(({ a }) => a.node.title)));
    picks.set(k, argmaxMember(members, vecOf, (_, v) => dot(sv, v), fallback));
  }
  return picks;
}

export async function scoreCase(c: Case, ctx: ScoreContext): Promise<Picks> {
  const query = c.q.query;
  const anchor = ctx.byId.get(c.unit.anchorId)!;
  const members = c.unit.memberIds.map((id) => ctx.byId.get(id)).filter((x): x is AtlasNode => !!x);
  const vecOf: VecOf = (n) => ctx.cache.get(contentHash(n));
  const pick = (score: (m: AtlasNode, v: number[]) => number) => argmaxMember(members, vecOf, score, anchor.id);
  const qv = await embedQuery(query);
  // RESIDUAL query: drop tokens the group ALREADY explains (the anchor's own title).
  // A query names its instance ("… Ethereum Mainnet - Fluid sUSDS ERC4626 Vault …")
  // and that long name dominates the embedding, so cosine ranks whichever member
  // echoes the instance name — the anchor itself, or a value that repeats part of
  // it — above the member that answers the question. Inside a group the instance
  // name discriminates nothing; only the rest of the question does.
  const rv = await embedQuery(residualQuery(query, [anchor.title]));
  // PROJECTION variant: the text-residual needs a second embedding call per grouped
  // hit, which is latency on the query hot path. Removing the instance name from the
  // TEXT is approximately removing the anchor's DIRECTION from the query vector, and
  // that is free arithmetic on vectors already held.
  const av = vecOf(anchor);
  const projQ = av ? withoutDirection(qv, av) : null;
  // MEMBER-PROJECTION: instead of removing the anchor direction from the QUERY at
  // request time (which needs no extra embed but cannot ever select the anchor, hence
  // kv-record 0%), remove it from each MEMBER at index time and store that. Free at
  // query time, and the anchor stays selectable because it is scored on its raw vector.
  const memberSide = (m: AtlasNode, v: number[]) => dot(qv, av && m.id !== anchor.id ? withoutDirection(v, av) : v);
  return {
    lex: pickLeaf(query, members, anchor).node.id,
    cos: pick((_, v) => dot(qv, v)),
    res: pick((_, v) => dot(rv, v)),
    prj: projQ ? pick((_, v) => dot(projQ, v)) : anchor.id,
    mpj: pick(memberSide),
    rrf: rrfPick(query, members, vecOf, qv, anchor.id),
    shared: await sharedPicks(query, members, vecOf, qv, ctx.anchorPool, anchor.id),
    available: !!vecOf(ctx.byId.get(c.target)!),
  };
}
