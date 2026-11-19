// Role-as-edge type sets emitted by build-graph.mjs for the prime → executor →
// facilitator/govops chain. Single-sourced here so a new role-edge variant from
// a future atlas PR is added once, not in every report that walks the chain.
//
// Note: rewardsIndex deliberately restricts to the operational_* variants only
// (not core_*), so it references those edge types explicitly rather than these
// sets — that narrowing is intentional, not drift.
import type { GraphEntity, RelationEdge } from "../types";

export const EXEC_EDGES = new Set(["operational_executor_agent_for", "core_executor_agent_for"]);
export const FAC_EDGES = new Set(["operational_facilitator_for", "core_facilitator_for"]);
export const GOV_EDGES = new Set(["operational_govops_for", "core_govops_for"]);
export const CHAIN_EDGES = new Set([...EXEC_EDGES, ...FAC_EDGES, ...GOV_EDGES]);

/** Agent id → the executor agent accountable for it: a Prime's executor (the
 *  first EXEC_EDGES edge, as buildChainMap reads it), and each executor itself. */
export function executorByAgent(participants: GraphEntity[], edges: RelationEdge[]): Map<string, GraphEntity> {
  const byId = new Map(participants.map((e) => [e.id, e]));
  const out = new Map<string, GraphEntity>();
  for (const e of participants) {
    if (e.et === "agent" && (e.st === "operational_executor" || e.st === "core_executor")) out.set(e.id, e);
  }
  for (const edge of edges) {
    const exec = EXEC_EDGES.has(edge.e) ? byId.get(edge.f) : undefined;
    if (exec && !out.has(edge.t)) out.set(edge.t, exec);
  }
  return out;
}
