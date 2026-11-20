// Vector and query-text arithmetic for leaf-attribution-score.ts.
import type { AtlasNode } from "../../src/types.ts";

export function cosine(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) d += a[i]! * b[i]!;
  return d; // both sides are L2-normalised by embed.ts
}

/** `v` with its component along `dir` removed, re-normalised. */
export function withoutDirection(v: number[], dir: number[]): number[] {
  const d = cosine(v, dir);
  const p = v.map((x, i) => x - d * dir[i]!);
  let nrm = 0;
  for (const x of p) nrm += x * x;
  nrm = Math.sqrt(nrm) || 1;
  return p.map((x) => x / nrm);
}

export const wordsOf = (text: string): string[] => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** The query minus every word in `strip`; the whole query when nothing is left. */
export const residualQuery = (query: string, strip: Set<string>): string =>
  wordsOf(query).filter((w) => !strip.has(w)).join(" ") || query;

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
