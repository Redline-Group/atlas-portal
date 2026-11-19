// Can the identity gate REUSE the vector semantic search already stores for a
// document, or does it need its own?
//
//   bun scripts/aux/identity-search-vector.ts [--embed] [--detail] [--samples]
//
// The gate's embedding result (identity-embedding-vs-word.ts) was measured on
// the raw BODY. Search stores something else: title + link-stripped body for
// most documents, and for a group anchor the folded key:value text of its
// children under a breadcrumb (src/server/retrieval/embed-units.ts). The gate
// runs only after a title change, so a vector that contains the title is a
// different measurement. This scores both on the same pairs.
//
//   body    cos(old body, new body)                    what was measured
//   search  cos(old stored text, new stored text)      what search would hold
//
// NEGATIVES are real, and they are the gate's true input: every document in
// the atlas git history that kept its UUID across a commit while its title
// changed. POSITIVES are synthetic, as everywhere else: a live document's slot
// holding a sibling's, or an unrelated document's, title and body.
//
// --embed    fetches the vectors the cache lacks (needs OPENROUTER_API_KEY)
// --detail   adds the score spreads, the combined rules and the group documents
// --samples  prints the real retitles a rule flags, to read and judge by hand

import { bodyWordsKept, lineOverlap } from "../../src/server/preview/identity.ts";
import { dot, qwenVectors } from "./identity-corpus.ts";
import { qs, rule, world, type Pair } from "./identity-search-pairs.ts";
import { printBands, printIntro } from "./identity-search-report.ts";
import { collectRetitles } from "./identity-search-retitles.ts";
import { addSwapPairs } from "./identity-search-swaps.ts";

const args = process.argv.slice(2);

const pairs: Pair[] = [];

// ---- real retitles, from the atlas git history ------------------------------
const latest = await collectRetitles(pairs);
const live0 = world(latest);
const retitleCount = pairs.length;

// ---- synthetic swaps, from the latest snapshot -------------------------------
addSwapPairs(pairs, live0);

// ---- score ------------------------------------------------------------------
for (const p of pairs) { p.word = bodyWordsKept(p.bodyA, p.bodyB) ?? 0; p.line = lineOverlap(p.bodyA, p.bodyB); }
const vecs = await qwenVectors(pairs.flatMap((p) => [p.bodyA, p.bodyB, p.searchA, p.searchB]), args.includes("--embed"));
for (const p of pairs) { p.body = dot(vecs.get(p.bodyA), vecs.get(p.bodyB)); p.search = dot(vecs.get(p.searchA), vecs.get(p.searchB)); }
const scored = pairs.filter((p) => !Number.isNaN(p.body) && !Number.isNaN(p.search));
if (scored.length < pairs.length) {
  console.log(`\n!! ${pairs.length - scored.length} of ${pairs.length} pairs have no vector and are left out. Run again with --embed to fetch them.`);
}

printIntro(scored);
const answers = printBands(scored, args.includes("--detail"));

const R = scored.filter((p) => p.group === "retitle");
const A = R.filter((p) => p.anchor);
console.log(`\n\n${rule(78)}\nANSWER\n${rule(78)}`);
for (const a of answers) console.log(a);
console.log(`
  Left out of the tables above: ${A.length} of the ${retitleCount} real retitles, because search
  stores those documents as a GROUP (the document with its children folded in,
  or under its ancestors' titles). ${live0.anchors.size} of ${live0.byId.size} live documents are stored
  that way. Their vector is not a vector of the document alone, so the gate
  should keep today's rule for them.

  Caution: "real retitles flagged" is not a count of mistakes. Nobody has
  labelled the retitles, and some of them are true replacements. Today's whole
  gate flags ${R.filter((p) => p.gate).length} of the ${R.length}. Run with --samples to read them.`);

if (args.includes("--detail")) {
  console.log(`\n  DETAIL: the ${A.length} real retitles stored as a group (5th to 95th percentile)`);
  console.log(`     the stored shape differs between the old and new side in ${A.filter((p) => p.shapeChanged).length} of them`);
  console.log(`     body    ${qs(A.map((p) => p.body))}\n     search  ${qs(A.map((p) => p.search))}`);
}
if (args.includes("--samples")) {
  const show = (p: Pair) => console.log(`\n  "${p.oldTitle}"\n    -> "${p.newTitle}"\n    old body: ${p.bodyA.replace(/\s+/g, " ").slice(0, 260)}\n    new body: ${p.bodyB.replace(/\s+/g, " ").slice(0, 260)}\n    search vector ${p.search.toFixed(3)}, body vector ${p.body.toFixed(3)}, words kept ${p.word.toFixed(3)}; today's gate ${p.gate ? "FLAGS it" : "does not flag it"}; body of ${p.band === "short" ? "1 to 3" : "4 to 20"} lines${p.anchor ? "; stored as a group" : ""}   [commit ${p.note}]`);
  console.log(`\n\n${rule(78)}\nSAMPLES: the 12 real retitles with the lowest search-vector score\n${rule(78)}`);
  [...R].sort((a, b) => a.search - b.search).slice(0, 12).forEach(show);
  console.log(`\n\n${rule(78)}\nSAMPLES: every real retitle of 4 to 20 lines with a search-vector score of 0.95 or less\n${rule(78)}`);
  R.filter((p) => p.band === "mid" && !p.anchor && p.search <= 0.95).sort((a, b) => a.search - b.search).forEach(show);
  console.log(`\n\n${rule(78)}\nSAMPLES: every real retitle that today's whole gate flags\n${rule(78)}`);
  R.filter((p) => p.gate).forEach(show);
}
