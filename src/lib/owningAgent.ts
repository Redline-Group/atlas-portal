import type { AtlasNode, GraphEntity } from "../types";
import type { AtlasBundle } from "./docsTypes";
import type { GraphData } from "./graphData";
import { buildAncestors } from "./atlasHelpers";

// Shorten long owning-agent names for the compact reader pill: "Executor" is the
// worst offender, so abbreviate it to "Exec." (e.g. "Core Council Executor
// Agent 1" → "Core Council Exec. Agent 1"). Applied at the owning-agent layer so
// every pill fed from here stays consistent.
export function abbreviateAgentName(name: string): string {
  return name.replace(/\bExecutor\b/g, "Exec.");
}

// Root doc id → agent for every agent participant (prime or executor). Every
// agent is a graph participant (et === "agent") whose `did` is its root doc.
export function agentsByRootDoc(graph: Pick<GraphData, "participants"> | null): Map<string, GraphEntity> {
  const byDoc = new Map<string, GraphEntity>();
  for (const p of graph?.participants ?? []) {
    if (p.et === "agent" && p.did) byDoc.set(p.did, p);
  }
  return byDoc;
}

// The nearest agent whose root doc is on `chain` (a doc_no ancestor chain,
// root first), so an executor nested under a prime wins over the prime. The
// caller decides whether the doc itself is on the chain.
export function nearestAgentOn(chain: AtlasNode[], byDoc: Map<string, GraphEntity>): GraphEntity | null {
  for (let i = chain.length - 1; i >= 0; i--) {
    const agent = byDoc.get(chain[i].id);
    if (agent) return agent;
  }
  return null;
}

// Nearest agent over a doc's ancestor chain (self excluded — an agent's own
// root doc isn't "under" an agent, it *is* one), abbreviated for the pill.
function nearestAgent(ancestors: AtlasNode[], byDoc: Map<string, GraphEntity>): string | null {
  const agent = nearestAgentOn(ancestors, byDoc);
  return agent ? abbreviateAgentName(agent.name) : null;
}

// The agent (prime or executor) whose subtree a doc lives under, or null: a doc
// is "under" an agent when that agent's root doc is one of the doc's ancestors.
// The doc_no ancestor chain is walked from nearest to furthest so the most
// specific owner wins (an executor nested under a prime wins over the prime).
export function findOwningAgent(
  targetId: string,
  atlas: Pick<AtlasBundle, "docs" | "docNoToId">,
  graph: GraphData | null,
): string | null {
  const agentByDoc = agentsByRootDoc(graph);
  if (agentByDoc.size === 0) return null;
  return nearestAgent(buildAncestors(atlas.docs, atlas.docNoToId, targetId), agentByDoc);
}

// Precompute the owning-agent name for every doc, so the reader can look up a
// pill per row without walking ancestors on each render. Same nearest-agent /
// self-excluded rule as findOwningAgent, resolved over the doc_no ancestor chain
// (robust to the depth-6 parentId flattening). Returns an empty map when the
// graph hasn't loaded (or failed to) or when no agents exist.
export function buildOwningAgentMap(
  atlas: Pick<AtlasBundle, "docs" | "docNoToId">,
  graph: GraphData | null,
): Map<string, string> {
  const map = new Map<string, string>();
  const agentByDoc = agentsByRootDoc(graph);
  if (agentByDoc.size === 0) return map;
  for (const id of Object.keys(atlas.docs)) {
    const name = nearestAgent(buildAncestors(atlas.docs, atlas.docNoToId, id), agentByDoc);
    if (name) map.set(id, name);
  }
  return map;
}
