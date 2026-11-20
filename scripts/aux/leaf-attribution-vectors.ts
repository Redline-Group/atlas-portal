// Vector arithmetic and member selection for leaf-attribution-score.ts.
import type { AtlasNode } from "../../src/types.ts";
import { dot } from "../eval/eval-retrieval-rank.ts";

/** `v` with its component along `dir` removed, re-normalised. */
export function withoutDirection(v: number[], dir: number[]): number[] {
  const d = dot(v, dir);
  const p = v.map((x, i) => x - d * dir[i]!);
  let nrm = 0;
  for (const x of p) nrm += x * x;
  nrm = Math.sqrt(nrm) || 1;
  return p.map((x) => x / nrm);
}

/** The id of the member scoring highest among those with a vector, else `fallback`. */
export function argmaxMember(
  members: AtlasNode[],
  vecOf: (n: AtlasNode) => number[] | undefined,
  score: (m: AtlasNode, v: number[]) => number,
  fallback: string,
): string {
  let pick = fallback;
  let best = -Infinity;
  for (const m of members) {
    const v = vecOf(m);
    if (!v) continue;
    const s = score(m, v);
    if (s > best) {
      best = s;
      pick = m.id;
    }
  }
  return pick;
}
