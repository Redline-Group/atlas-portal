// The synthetic swaps of identity-search-vector.ts: a live document's slot
// holding a sibling's, or an unrelated document's, title and body.

import { buildEmbedText } from "../../src/server/retrieval/embed-text.ts";
import { bodyWhollyReplaced, JUDGEABLE_MIN_WORDS } from "../../src/server/preview/identity.ts";
import { parentOf, prng, swappable, wordCount } from "./identity-corpus.ts";
import { groupBy } from "../../src/lib/collections.ts";
import { band, type Node, type Pair, type World } from "./identity-search-pairs.ts";

const swapPair = (live: World, group: Pair["group"], o: Node, c: Node): Pair => ({
  group, band: band(o.content), anchor: false, shapeChanged: false, oldTitle: o.title, newTitle: c.title,
  bodyA: o.content, bodyB: c.content,
  // The slot keeps its place in the tree and takes the other document's title
  // and body — which, for a document that anchors no group, is all search stores.
  searchA: live.stored.get(o.id)!, searchB: buildEmbedText({ title: c.title, content: c.content }),
  bodyTest: bodyWhollyReplaced(o.content, c.content), gate: false, note: `${o.id.slice(0, 8)}>${c.id.slice(0, 8)}`, body: NaN, search: NaN, word: NaN, line: NaN,
});

function shuffle<T>(xs: T[], rnd: () => number) {
  for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; }
}

/** Appends sibling and unrelated swap pairs, built from the latest snapshot, to `pairs`. */
export function addSwapPairs(pairs: Pair[], live: World) {
  const liveNodes = [...live.byId.values()].filter((n) => wordCount(n.content) >= JUDGEABLE_MIN_WORDS && !live.anchors.has(n.id));
  const { pick, rnd } = prng(7);
  const byParent = groupBy(liveNodes, parentOf);
  const swap = (group: Pair["group"], o: Node, c: Node) => pairs.push(swapPair(live, group, o, c));
  for (const [name, per, cap] of [["short", 1, 1500], ["mid", 3, 1e9]] as const) {
    const olds = liveNodes.filter((n) => band(n.content) === name);
    // Shuffle, then take each old body once, so no pair repeats.
    shuffle(olds, rnd);
    let n = 0;
    for (const o of olds) {
      if (n >= cap) break;
      // A sibling of similar size: a one-line slot holding a table is not the
      // repurposing that is hard to see.
      const sibs = (byParent.get(parentOf(o)) ?? []).filter((c) => swappable(o, c) && (name === "short" || band(c.content) !== "short"));
      if (!sibs.length) continue;
      n++;
      for (let k = 0; k < per && sibs.length; k++) swap("sibling", o, sibs.splice(Math.floor(rnd() * sibs.length), 1)[0]);
      const c = pick(liveNodes);
      if (swappable(o, c)) swap("unrelated", o, c);
    }
  }
}
