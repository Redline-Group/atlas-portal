#!/usr/bin/env bun
/**
 * Does SEMANTIC leaf attribution beat the lexical one?
 *
 *   bun scripts/aux/leaf-attribution-experiment.ts
 *
 * WHY. On the 2026-08-18 paraphrased query set, retrieval puts the right group in the
 * top 10 for essentially every ICD query (recall 1.000) but only lands on the right
 * DOCUMENT 27-38% of the time. The gap is `pickLeaf` in embed-units.ts, which scores
 * members by counting query terms in their title/content. Measured directly it is
 * ~34% accurate, and its failures are semantic, not lexical: "which chain does X run
 * on" picks "Off-chain Operational Parameters" over "Network"; "what asset does X use"
 * picks "Asset Supplied By …" over "Token". Word-boundary matching, stopwords and
 * within-group IDF all scored WORSE than the current code when measured.
 *
 * This measures the alternative before anything is built: attribute by cosine between
 * the query embedding and each member's own vector. Cheap, because the DB still holds
 * one-to-one vectors for every leaf — only the queries need embedding.
 *
 * Reports lexical vs cosine accuracy plus an availability ceiling (how often the
 * correct leaf's vector could be found at all), so a low score can't be mistaken for a
 * method failure when it is really missing data.
 */
import { anchorPoolOf, embedMissing, loadCases, loadVectorCache } from "./leaf-attribution-data.ts";
import { K_VALUES, METHODS, scoreCase } from "./leaf-attribution-score.ts";

const { byId, units, cases } = loadCases();
const cache = await loadVectorCache();
await embedMissing(cases, byId, cache);

const anchorPool = anchorPoolOf(units, byId, cache);
console.log(`  anchor pool for the shared-residual simulation: ${anchorPool.length}`);
const sharedRight = new Map<number, number>(K_VALUES.map((k) => [k, 0]));

const tally = () => ({ lex: 0, cos: 0, rrf: 0, res: 0, prj: 0, mpj: 0 });
const right = tally();
let available = 0;
let n = 0;
const bySlice = new Map<string, ReturnType<typeof tally> & { n: number }>();
const flips: string[] = [];

for (const c of cases) {
  const picks = await scoreCase(c, { byId, cache, anchorPool });
  for (const [k, pick] of picks.shared) {
    if (pick === c.target) sharedRight.set(k, (sharedRight.get(k) ?? 0) + 1);
  }

  n++;
  if (picks.available) available++;
  const b = bySlice.get(c.q.slice) ?? { n: 0, ...tally() };
  b.n++;
  for (const m of METHODS) {
    if (picks[m] !== c.target) continue;
    right[m]++;
    b[m]++;
  }
  bySlice.set(c.q.slice, b);
  if (picks.lex !== c.target && picks.cos === c.target && flips.length < 6) {
    flips.push(`  "${c.q.query.slice(0, 56)}"\n     lexical: ${byId.get(picks.lex)?.title} → cosine: ${byId.get(picks.cos)?.title}`);
  }
}

const pct = (x: number) => `${((100 * x) / n).toFixed(0)}%`;
console.log(`\nattribution accuracy over ${n} queries:`);
console.log(`  lexical (current pickLeaf) : ${right.lex}/${n} = ${pct(right.lex)}`);
console.log(`  cosine  (query vs member)  : ${right.cos}/${n} = ${pct(right.cos)}`);
console.log(`  RRF fusion of both         : ${right.rrf}/${n} = ${pct(right.rrf)}`);
console.log(`  cosine on RESIDUAL query   : ${right.res}/${n} = ${pct(right.res)}`);
console.log(`  PROJECTION query-side (free)     : ${right.prj}/${n} = ${pct(right.prj)}`);
console.log(`  PROJECTION member-side (free)    : ${right.mpj}/${n} = ${pct(right.mpj)}`);
for (const k of K_VALUES) {
  const r = sharedRight.get(k) ?? 0;
  console.log(`  SHARED residual, top-${String(k).padEnd(2)} anchors : ${r}/${n} = ${pct(r)}`);
}
console.log(`  ceiling (target vector available at all): ${available}/${n} = ${pct(available)}`);
console.log(`\nby slice:`);
for (const [s, b] of bySlice) {
  console.log(
    `  ${s.padEnd(20)} n=${String(b.n).padStart(3)}  lexical ${((100 * b.lex) / b.n).toFixed(0)}%  cosine ${((100 * b.cos) / b.n).toFixed(0)}%  rrf ${((100 * b.rrf) / b.n).toFixed(0)}%  residual ${((100 * b.res) / b.n).toFixed(0)}%  proj ${((100 * b.prj) / b.n).toFixed(0)}%  memproj ${((100 * b.mpj) / b.n).toFixed(0)}%`,
  );
}
if (flips.length) {
  console.log(`\ncases cosine fixes:`);
  for (const f of flips) console.log(f);
}
