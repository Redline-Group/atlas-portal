// The pairs identity-search-vector.ts scores: real retitles from the atlas git
// history, and synthetic swaps made from the latest snapshot.
import { planEmbedRows, shippedPolicy } from "../../src/server/retrieval/embed-rows.ts";
import { buildEmbedText } from "../../src/server/retrieval/embed-text.ts";
import { bodyWhollyReplaced, detectIdentitySwaps, JUDGEABLE_MIN_WORDS, SHORT_BODY_MAX_LINES, type SwapNode } from "../../src/server/preview/identity.ts";
import { lineCount, parentOf, prng, swappable, walkRetitles, wordCount, type HistoryNode } from "./identity-corpus.ts";
import { groupBy } from "../../src/lib/collections.ts";

type Node = HistoryNode;

// `anchors` holds every document whose stored text is NOT simply its own title
// and body: a group anchor, and also a unit of one that carries a breadcrumb or
// key:value form. A document can enter or leave that set between two commits,
// and the two vectors are then texts of different shapes.
export interface World { byId: Map<string, Node>; stored: Map<string, string>; anchors: Set<string> }

/** A snapshot as search would see it: every document's node, and the text
 *  stored under its id. The rows are production's own (planEmbedRows), so the
 *  script and the preview build agree on which documents are stored as a group. */
export function world(byId: Map<string, Node>): World {
  const { rows } = planEmbedRows([...byId.values()] as any, shippedPolicy());
  return {
    byId,
    stored: new Map(rows.map((r) => [r.id, r.text])),
    anchors: new Set(rows.filter((r) => !r.plain).map((r) => r.id)),
  };
}

export interface Pair {
  group: "retitle" | "sibling" | "unrelated";
  band: "short" | "mid" | "long";
  anchor: boolean;
  shapeChanged: boolean;
  oldTitle: string; newTitle: string;
  bodyA: string; bodyB: string; searchA: string; searchB: string;
  bodyTest: boolean; // bodyWhollyReplaced, the shipped body test
  gate: boolean; // the whole shipped gate (retitles only)
  note: string;
  body: number; search: number;
  word: number; line: number;
}
const band = (t: string): Pair["band"] => { const n = lineCount(t); return n <= SHORT_BODY_MAX_LINES ? "short" : n <= 20 ? "mid" : "long"; };

type Commit = Parameters<Parameters<typeof walkRetitles>[0]>[0];

/** The ids the whole shipped gate flags between two snapshots. */
function gateFlags(before: World, after: World): Record<string, unknown> {
  const changed = [...after.byId.keys()].filter((id) => {
    const a = before.byId.get(id), b = after.byId.get(id)!;
    return a && (a.content !== b.content || a.title !== b.title);
  });
  const added = [...after.byId.keys()].filter((id) => !before.byId.has(id));
  const swapNodes = (w: World) => w.byId as Map<string, SwapNode>;
  return detectIdentitySwaps({ changed, added, mainById: swapNodes(before), previewById: swapNodes(after) }).identitySwap;
}

function retitlePair(c: Commit, id: string, before: World, after: World, gate: boolean): Pair | null {
  const a = before.byId.get(id)!, b = after.byId.get(id)!;
  if (!a.content.trim() || !b.content.trim()) return null; // the gate skips a stub on either side
  if (wordCount(a.content) < JUDGEABLE_MIN_WORDS) return null; // …and a body too small to judge
  return {
    group: "retitle", band: band(a.content), anchor: before.anchors.has(id) || after.anchors.has(id),
    shapeChanged: before.anchors.has(id) !== after.anchors.has(id),
    oldTitle: a.title, newTitle: b.title,
    bodyA: a.content, bodyB: b.content, searchA: before.stored.get(id)!, searchB: after.stored.get(id)!,
    bodyTest: bodyWhollyReplaced(a.content, b.content), gate,
    note: `${c.hash.slice(0, 7)} ${c.date.slice(0, 10)} ${id.slice(0, 8)}`, body: NaN, search: NaN, word: NaN, line: NaN,
  };
}

/** Pushes one pair per judgeable retitle in the atlas git history; resolves to the latest snapshot. */
export function collectRetitles(pairs: Pair[]) {
  let lastWorld: { of: Map<string, Node>; world: World } | null = null;
  return walkRetitles((c, beforeNodes, afterNodes, ids) => {
    // Rows are planned over the whole atlas, so only for commits that need it,
    // and the "after" of one such commit is often the "before" of the next.
    const before = lastWorld?.of === beforeNodes ? lastWorld.world : world(beforeNodes);
    const after = world(afterNodes);
    lastWorld = { of: afterNodes, world: after };
    const identitySwap = gateFlags(before, after);
    for (const id of ids) {
      const pair = retitlePair(c, id, before, after, id in identitySwap);
      if (pair) pairs.push(pair);
    }
  });
}

function swapPair(group: Pair["group"], o: Node, c: Node, live: World): Pair {
  return {
    group, band: band(o.content), anchor: false, shapeChanged: false, oldTitle: o.title, newTitle: c.title,
    bodyA: o.content, bodyB: c.content,
    // The slot keeps its place in the tree and takes the other document's title
    // and body — which, for a document that anchors no group, is all search stores.
    searchA: live.stored.get(o.id)!, searchB: buildEmbedText({ title: c.title, content: c.content }),
    bodyTest: bodyWhollyReplaced(o.content, c.content), gate: false, note: `${o.id.slice(0, 8)}>${c.id.slice(0, 8)}`, body: NaN, search: NaN, word: NaN, line: NaN,
  };
}

/** Pushes the made-up replacements: each live document paired with siblings and with a random other document. */
export function addSyntheticSwaps(pairs: Pair[], live: World): void {
  const liveNodes = [...live.byId.values()].filter((n) => wordCount(n.content) >= JUDGEABLE_MIN_WORDS && !live.anchors.has(n.id));
  const { pick, rnd } = prng(7);
  const byParent = groupBy(liveNodes, parentOf);
  const swap = (group: Pair["group"], o: Node, c: Node) => pairs.push(swapPair(group, o, c, live));
for (const [name, per, cap] of [["short", 1, 1500], ["mid", 3, 1e9]] as const) {
  const olds = liveNodes.filter((n) => band(n.content) === name);
  // Shuffle, then take each old body once, so no pair repeats.
  for (let i = olds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [olds[i], olds[j]] = [olds[j], olds[i]]; }
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
