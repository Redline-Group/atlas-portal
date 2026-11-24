import type { AtlasNode } from "@/types";
import { normTitle } from "@/lib/cousinFiling";
import { byDocNo } from "@/lib/docNo";
import { titleKeyer } from "./cousinTitles";

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

/**
 * Best cousins first, capped: by name (same, same but the agent's, different),
 * then the target's own prime before the others, then the target's status
 * (active/completed) before the other, then doc_no.
 */
export function rankCousins<T extends RankedCousin>(
  docs: Record<string, AtlasNode>,
  target: AtlasNode,
  matches: T[],
  targetCompleted = false,
): T[] {
  const tier = new Map(matches.map((m) => [m, nameTier(docs, target, m.node)]));
  const status = (m: T) => Number(m.completed !== targetCompleted);
  return matches
    .sort((a, b) => tier.get(a)! - tier.get(b)! || Number(b.own) - Number(a.own) || status(a) - status(b) || byDocNo(a.node, b.node))
    .slice(0, MAX_COUSINS);
}
