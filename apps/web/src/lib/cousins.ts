import type { AtlasNode, GraphEntity } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import type { GraphData } from "./graph";
import { buildAncestorsWithSelf } from "@/lib/atlasHelpers";
import { abbreviateAgentName } from "@/lib/owningAgent";
import { primeRoots, titleIndex, titleKeyer } from "./cousinTitles";
import { instanceCousins } from "./cousinInstances";
import { findSkeletonCousins } from "./cousinSkeleton";
import { rankCousins } from "./cousinRank";
import { isIcdLocation, locationCousins } from "./cousinLocations";

export interface CousinDoc {
  node: AtlasNode;
  agent: string;
  /** The cousin's instance is filed under Completed Instances. */
  completed?: boolean;
}

// A doc under a Prime Agent's "Omni Documents" subtree: A.6.1.1.<agent>.3(.…).
// fragile: doc_no prefix — the Prime Agents scope root (A.6.1.1) and the omni
// section suffix (.3) are hardcoded; a renumber silently drops omni cousins.
const OMNI_RE = /^A\.6\.1\.1\.(\d+)\.3(?:\..+)?$/;

// A title only counts as an omni cousin when at least this share of its
// atlas-wide occurrences are omni docs — high enough to reject generic section
// titles ("Parameters", "Data Repository") that merely recur across the atlas.
const OMNI_SHARE_MIN = 0.7;

// Omni-doc cousins. Some docs recur across every Prime Agent's Omni Documents
// subtree (e.g. "Sky Forum", "Governance Information Unrelated To Root Edit
// Primitive"), but that subtree is numbered agent-specifically — the primitive
// suffix-parallelism doesn't hold and these get no covering instance/invocation/
// primitive entity, so findCousinDocs' main path misses them. Match them
// deterministically by title key across agents, with two guards (no allowlist):
//   • same true depth (uncapped doc_no segment count), and
//   • the title is omni-specific: >= OMNI_SHARE_MIN of its atlas-wide uses are
//     omni docs — this is what separates real omni docs from generic titles.
function findOmniCousins(
  targetDoc: AtlasNode | undefined,
  atlas: Pick<AtlasBundle, "docs" | "docNoToId">,
  graph: GraphData,
): CousinDoc[] {
  const m = targetDoc?.doc_no.match(OMNI_RE);
  if (!targetDoc || !m) return [];
  const targetAgent = m[1];
  const titleKey = titleKeyer(atlas.docs)(targetDoc.title);
  if (!titleKey) return [];
  const targetSeg = targetDoc.doc_no.split(".").length;

  const sameTitle = titleIndex(atlas.docs).get(titleKey) ?? [];
  const global = sameTitle.length; // atlas-wide docs with this title (always >= 1: target is one)
  let omni = 0; //                    …of which are omni docs
  const byAgent = new Map<string, AtlasNode>(); // other agent → its equivalent doc
  for (const d of sameTitle) {
    const om = d.doc_no.match(OMNI_RE);
    if (!om) continue;
    omni++;
    if (om[1] === targetAgent || d.doc_no.split(".").length !== targetSeg) continue;
    if (!byAgent.has(om[1])) byAgent.set(om[1], d);
  }
  if (byAgent.size === 0 || omni / global < OMNI_SHARE_MIN) return [];

  return labelled(atlas, graph, targetDoc, [...byAgent].map(([prime, node]) => ({ node, prime })));
}

// The nearest instance / invocation / primitive entity defined at the target or an ancestor.
function coveringEntity(targetId: string, atlas: Pick<AtlasBundle, "docs" | "docNoToId">, graph: GraphData) {
  const byDid = new Map<string, { ent: GraphEntity; pool: GraphEntity[] }>();
  for (const pool of [graph.instances, graph.invocations, graph.primitives]) {
    for (const ent of pool) if (ent.did) byDid.set(ent.did, { ent, pool });
  }
  const chain = buildAncestorsWithSelf(atlas.docs, atlas.docNoToId, targetId);
  for (let i = chain.length - 1; i >= 0; i--) {
    const hit = byDid.get(chain[i].id);
    if (hit) return hit;
  }
  return undefined;
}

// A doc no primitive/instance/invocation entity covers: an omni doc, or the
// artifact skeleton around the primitives.
function uncoveredCousins(target: AtlasNode, atlas: Pick<AtlasBundle, "docs" | "docNoToId">, graph: GraphData): CousinDoc[] {
  if (OMNI_RE.test(target.doc_no)) return findOmniCousins(target, atlas, graph);
  return labelled(atlas, graph, target, findSkeletonCousins(target, atlas));
}

// Ranks other-prime cousins found by prime number and names each one's agent.
function labelled(atlas: Pick<AtlasBundle, "docs">, graph: GraphData, target: AtlasNode, found: { node: AtlasNode; prime: string }[]): CousinDoc[] {
  const label = primeLabeler(atlas, graph);
  const ranked = rankCousins(atlas.docs, target, found.map((f) => ({ ...f, own: false, completed: false })));
  return ranked.map(({ node, prime }) => ({ node, agent: label(prime) }));
}

// Display name of the Prime Agent whose artifact is A.6.1.1.<prime>.
function primeLabeler(atlas: Pick<AtlasBundle, "docs">, graph: GraphData): (prime: string) => string {
  const agentName = new Map(
    graph.participants
      .filter((p) => p.et === "agent" && p.did)
      .map((p) => [p.did as string, abbreviateAgentName(p.name)]),
  );
  const roots = primeRoots(atlas.docs);
  return (prime) => {
    const root = roots.get(prime);
    return (root && (agentName.get(root.id) ?? root.title)) || "Unknown";
  };
}

// "Cousins" of a doc: the doc that plays the same part in related instances,
// under other Prime Agents and, for multi-instance primitives, the same one.
// The graph tags every instance / invocation / primitive entity with its
// primitive slug (st) and owning agent; a doc inside an instance subtree
// resolves to its covering entity via the doc_no ancestor chain (raw parentId
// is flattened at the depth-6 heading cap — see instanceDescendants.ts). The
// matching itself is in cousinInstances.ts.
export function findCousinDocs(
  targetId: string,
  atlas: Pick<AtlasBundle, "docs" | "docNoToId">,
  graph: GraphData,
): CousinDoc[] {
  const target = atlas.docs[targetId];
  if (!target) return [];
  if (isIcdLocation(target)) return locationCousins(atlas.docs, target, (id) => findCousinDocs(id, atlas, graph));
  const hit = coveringEntity(targetId, atlas, graph);
  if (!hit?.ent.st) return uncoveredCousins(target, atlas, graph);

  const agentName = new Map(
    graph.participants.filter((p) => p.et === "agent").map((p) => [p.id, abbreviateAgentName(p.name)]),
  );
  return instanceCousins(atlas, target, hit.ent, hit.pool).map(({ node, agentDocId, completed }) => ({
    node,
    agent: agentName.get(agentDocId) ?? atlas.docs[agentDocId]?.title ?? "Unknown",
    ...(completed ? { completed } : {}),
  }));
}
