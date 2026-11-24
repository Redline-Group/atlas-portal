import type { AtlasNode } from "@/types";
import { normTitle } from "@/lib/cousinFiling";
import { byDocNo } from "@/lib/docNo";
import { titleKeyer, titleWords } from "./cousinTitles";

export const MAX_COUSINS = 16;

export interface RankedCousin {
  node: AtlasNode;
  /** In the target's own Prime Agent artifact. */
  own: boolean;
  completed: boolean;
}

// 0: the same name; 1: the same once agent names, spacing and punctuation are
// set aside ("Spark Liquidity Layer" / "Grove Liquidity Layer"); 2: a different name.
export function nameTier(docs: Record<string, AtlasNode>, a: AtlasNode, b: AtlasNode): number {
  if (normTitle(a.title) === normTitle(b.title)) return 0;
  const key = titleKeyer(docs);
  return key(a.title) === key(b.title) ? 1 : 2;
}

// Name and prime weigh together: the score is their product, so the same name in
// the target's own prime (6) leads, then the agent's-name variant there (4), then
// the same name elsewhere (3), and the two scoring 2 split by name.
const NAME_WEIGHT = [3, 2, 1];
const PRIME_WEIGHT = { own: 2, other: 1 };

// Share of the two titles' words they have in common (agent names count as one
// shared word), which orders the different-name tier: "Aave Core v3 USDC" sits
// nearer "Aave Core USDC" than "Aave USDe".
export function nameSimilarity(docs: Record<string, AtlasNode>, a: AtlasNode, b: AtlasNode): number {
  const wa = titleWords(docs, a.title);
  const wb = titleWords(docs, b.title);
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  const union = wa.size + wb.size - shared;
  return union ? shared / union : 0;
}

/**
 * Best cousins first, capped: by the name × prime score, then by name alone,
 * then (different names only) by name similarity, then the target's status
 * (active/completed) before the other, then doc_no.
 */
export function rankCousins<T extends RankedCousin>(
  docs: Record<string, AtlasNode>,
  target: AtlasNode,
  matches: T[],
  targetCompleted = false,
  limit = MAX_COUSINS,
): T[] {
  const tier = new Map(matches.map((m) => [m, nameTier(docs, target, m.node)]));
  const similar = new Map(matches.map((m) => [m, tier.get(m) === 2 ? nameSimilarity(docs, target, m.node) : 1]));
  const score = (m: T) => NAME_WEIGHT[tier.get(m)!] * (m.own ? PRIME_WEIGHT.own : PRIME_WEIGHT.other);
  const status = (m: T) => Number(m.completed !== targetCompleted);
  return matches
    .sort(
      (a, b) =>
        score(b) - score(a) || tier.get(a)! - tier.get(b)! || similar.get(b)! - similar.get(a)! || status(a) - status(b) || byDocNo(a.node, b.node),
    )
    .slice(0, limit);
}
