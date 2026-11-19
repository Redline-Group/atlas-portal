// The real retitles of identity-search-vector.ts: every document in the atlas
// git history that kept its UUID across a commit while its title changed.

import { bodyWhollyReplaced, detectIdentitySwaps, JUDGEABLE_MIN_WORDS, type SwapNode } from "../../src/server/preview/identity.ts";
import { walkRetitles, wordCount } from "./identity-corpus.ts";
import { band, world, type Node, type Pair, type World } from "./identity-search-pairs.ts";

type Commit = { hash: string; date: string };

const swapNodes = (w: World) => w.byId as Map<string, SwapNode>;

// Rows are planned over the whole atlas, so only for commits that need it,
// and the "after" of one such commit is often the "before" of the next.
let lastWorld: { of: Map<string, Node>; world: World } | null = null;

/** The ids the shipped gate flags as replaced between two snapshots. */
function gateFlags(before: World, after: World) {
  const changed = [...after.byId.keys()].filter((id) => {
    const a = before.byId.get(id), b = after.byId.get(id)!;
    return a && (a.content !== b.content || a.title !== b.title);
  });
  const added = [...after.byId.keys()].filter((id) => !before.byId.has(id));
  return detectIdentitySwaps({ changed, added, mainById: swapNodes(before), previewById: swapNodes(after) }).identitySwap;
}

function retitlePair(c: Commit, id: string, before: World, after: World, flagged: Record<string, unknown>): Pair | null {
  const a = before.byId.get(id)!, b = after.byId.get(id)!;
  if (!a.content.trim() || !b.content.trim()) return null; // the gate skips a stub on either side
  if (wordCount(a.content) < JUDGEABLE_MIN_WORDS) return null; // …and a body too small to judge
  return {
    group: "retitle", band: band(a.content), anchor: before.anchors.has(id) || after.anchors.has(id),
    shapeChanged: before.anchors.has(id) !== after.anchors.has(id),
    oldTitle: a.title, newTitle: b.title,
    bodyA: a.content, bodyB: b.content, searchA: before.stored.get(id)!, searchB: after.stored.get(id)!,
    bodyTest: bodyWhollyReplaced(a.content, b.content), gate: id in flagged,
    note: `${c.hash.slice(0, 7)} ${c.date.slice(0, 10)} ${id.slice(0, 8)}`, body: NaN, search: NaN, word: NaN, line: NaN,
  };
}

/** Appends a pair per real retitle to `pairs`; returns the latest snapshot. */
export function collectRetitles(pairs: Pair[]) {
  return walkRetitles((c, beforeNodes, afterNodes, ids) => {
    const before = lastWorld?.of === beforeNodes ? lastWorld.world : world(beforeNodes);
    const after = world(afterNodes);
    lastWorld = { of: afterNodes, world: after };
    const flagged = gateFlags(before, after);
    for (const id of ids) {
      const pair = retitlePair(c, id, before, after, flagged);
      if (pair) pairs.push(pair);
    }
  });
}
