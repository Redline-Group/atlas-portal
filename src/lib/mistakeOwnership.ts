// Who a Potential Mistakes finding belongs to: the Atlas Scope its document
// sits in, the Agent Artifact (if any) it sits in, and the Executor Agent
// accountable for that artifact.
//
// Everything is resolved by UUID — a parentId walk to the root for the scope,
// an ancestor matching an agent entity's defining doc for the artifact, and the
// graph's {operational,core}_executor_agent_for edge for a Prime's executor —
// so a renumbering never moves a finding to the wrong bucket. An executor
// agent's own artifact belongs to that executor. A document outside every
// agent artifact (the Scopes, the Agent Scope's framework text) has no
// executor agent, and is bucketed as such rather than guessed.

import type { AtlasNode, GraphEntity, RelationEdge } from "../types";
import { EXEC_EDGES } from "./roleEdges";

export interface Ownership {
  /** Slug of the root (Scope) document's title, e.g. "the-governance-scope". */
  scope: string;
  scopeLabel: string;
  /** Name of the Agent Artifact the document sits in, or "". */
  agent: string;
  /** Executor entity slug, or NO_EXECUTOR when the doc is in no agent artifact. */
  executor: string;
  executorLabel: string;
}

/** The unresolvable owner: a corpus-wide finding, or a doc gone from the atlas. */
export const NO_OWNER: Ownership = { scope: "", scopeLabel: "", agent: "", executor: "", executorLabel: "" };

export const NO_EXECUTOR = "none";
export const NO_EXECUTOR_LABEL = "No executor agent";

const AGENT_SUBTYPES = new Set(["prime", "operational_executor", "core_executor"]);
const EXECUTOR_SUBTYPES = new Set(["operational_executor", "core_executor"]);

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** "A.1 Governance" — the root's doc_no is display-only; the key is the title slug. */
const scopeLabel = (root: AtlasNode): string =>
  `${root.doc_no} ${root.title.replace(/^the\s+/i, "").replace(/\s+scope$/i, "")}`;

type Graph = { participants: GraphEntity[]; edges: RelationEdge[] } | null;

interface OwnerIndex {
  agentByDocId: Map<string, GraphEntity>;
  executorByAgentId: Map<string, GraphEntity>;
}

function indexAgents(graph: Graph): OwnerIndex {
  const agentByDocId = new Map<string, GraphEntity>();
  const executorByAgentId = new Map<string, GraphEntity>();
  if (!graph) return { agentByDocId, executorByAgentId };
  const byId = new Map(graph.participants.map((e) => [e.id, e]));
  for (const e of graph.participants) {
    if (e.did && e.st && AGENT_SUBTYPES.has(e.st)) agentByDocId.set(e.did, e);
    if (e.st && EXECUTOR_SUBTYPES.has(e.st)) executorByAgentId.set(e.id, e);
  }
  for (const edge of graph.edges) {
    if (!EXEC_EDGES.has(edge.e)) continue;
    const exec = byId.get(edge.f);
    if (exec) executorByAgentId.set(edge.t, exec);
  }
  return { agentByDocId, executorByAgentId };
}

function resolveOne(docs: Record<string, AtlasNode>, graph: Graph, idx: OwnerIndex, uuid: string): Ownership {
  let cur = docs[uuid];
  let agent: GraphEntity | undefined;
  for (let i = 0; i < 64; i++) {
    agent ??= idx.agentByDocId.get(cur.id);
    const parent = cur.parentId ? docs[cur.parentId] : undefined;
    if (!parent) break;
    cur = parent;
  }
  const exec = agent ? idx.executorByAgentId.get(agent.id) : undefined;
  return {
    scope: slugify(cur.title),
    scopeLabel: scopeLabel(cur),
    agent: agent?.name ?? "",
    executor: exec ? exec.slug : graph ? NO_EXECUTOR : "",
    executorLabel: exec ? exec.name : graph ? NO_EXECUTOR_LABEL : "",
  };
}

/**
 * Returns a memoising lookup from document UUID to its Ownership, or null when
 * the UUID is not in the served atlas. Without a graph the scope still
 * resolves; agent and executor stay empty ("" — not NO_EXECUTOR, which is a
 * positive finding that the doc is outside every agent artifact).
 */
export function ownershipResolver(docs: Record<string, AtlasNode>, graph: Graph): (uuid: string | null) => Ownership | null {
  const idx = indexAgents(graph);
  const cache = new Map<string, Ownership>();
  return (uuid) => {
    if (!uuid || !docs[uuid]) return null;
    let hit = cache.get(uuid);
    if (!hit) cache.set(uuid, (hit = resolveOne(docs, graph, idx, uuid)));
    return hit;
  };
}

/** Ownership buckets present in the rows, with pill labels. Scopes keep atlas
 *  order (their labels lead with the root doc_no); executors sort by name with
 *  "no executor agent" last. Unresolvable rows ("" key) get no pill. */
export function presentOwners(rows: readonly Ownership[], key: "scope" | "executor") {
  const labels: Record<string, string> = {};
  for (const r of rows) if (r[key]) labels[r[key]] = key === "scope" ? r.scopeLabel : r.executorLabel;
  const keys = Object.keys(labels).sort(
    (a, b) =>
      Number(a === NO_EXECUTOR) - Number(b === NO_EXECUTOR) ||
      labels[a].localeCompare(labels[b], undefined, { numeric: true }),
  );
  return { keys, labels };
}
