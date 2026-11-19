// Who a Potential Mistakes finding belongs to: the Atlas Scope its document
// sits in, the Agent Artifact (if any) it sits in, and the Executor Agent
// accountable for that artifact.
//
// The scope is the doc's top-level ancestor (rootDoc), keyed by its UUID. The
// artifact is the nearest agent on the doc's ancestor chain (owningAgent.ts),
// with the doc itself included: a finding on an agent's root doc is about that
// agent's artifact. The executor is that agent's executor (roleEdges.ts) —
// a Prime's executor agent, or the executor itself for its own artifact. A
// doc outside every agent artifact (the Scopes, the Agent Scope's framework
// text) has no executor agent and is bucketed as such rather than guessed.

import type { AtlasNode, GraphEntity, RelationEdge } from "../types";
import { buildAncestorsWithSelf, rootDoc } from "./atlasHelpers";
import { agentsByRootDoc, nearestAgentOn } from "./owningAgent";
import { executorByAgent } from "./roleEdges";

export interface Ownership {
  /** UUID of the enclosing Scope document, or "". */
  scope: string;
  /** "A.1 Governance" — the doc_no is display only. */
  scopeLabel: string;
  /** Name of the agent whose artifact holds the doc, or "". */
  agent: string;
  /** Executor slug; NO_EXECUTOR when no executor is accountable; "" when unknown (no graph). */
  executor: string;
  /** Executor name, or "" when there is none. */
  executorLabel: string;
  /** The executor is a different agent from `agent` (the artifact is a Prime's). */
  viaExecutor: boolean;
}

/** The unresolvable owner: a corpus-wide finding, or a doc gone from the atlas. */
export const NO_OWNER: Ownership = {
  scope: "",
  scopeLabel: "",
  agent: "",
  executor: "",
  executorLabel: "",
  viaExecutor: false,
};

export const NO_EXECUTOR = "none";
export const NO_EXECUTOR_LABEL = "No executor agent";

const scopeLabel = (root: AtlasNode): string =>
  `${root.doc_no} ${root.title.replace(/^the\s+/i, "").replace(/\s+scope$/i, "")}`;

type Graph = { participants: GraphEntity[]; edges: RelationEdge[] } | null;

/**
 * Lookup from the UUID of a doc in `docs` to its Ownership. Without a graph
 * the scope still resolves; agent and executor stay "" (unknown, which is not
 * NO_EXECUTOR — that is a positive finding that no executor is accountable).
 */
export function ownershipResolver(docs: Record<string, AtlasNode>, graph: Graph): (uuid: string) => Ownership {
  const docNoToId = new Map(Object.values(docs).map((d) => [d.doc_no, d.id]));
  const agents = agentsByRootDoc(graph);
  const executors = graph ? executorByAgent(graph.participants, graph.edges) : new Map<string, GraphEntity>();
  return (uuid) => {
    const root = rootDoc(docs, uuid);
    const agent = nearestAgentOn(buildAncestorsWithSelf(docs, docNoToId, uuid), agents);
    const exec = agent ? executors.get(agent.id) : undefined;
    return {
      scope: root?.id ?? "",
      scopeLabel: root ? scopeLabel(root) : "",
      agent: agent?.name ?? "",
      executor: exec?.slug ?? (graph ? NO_EXECUTOR : ""),
      executorLabel: exec?.name ?? "",
      viaExecutor: !!exec && exec.id !== agent?.id,
    };
  };
}

/** Pill keys present in `rows` (skipping ""), ordered by label with numeric
 *  doc_no runs ("A.2" before "A.10") and `last` pinned at the end. */
export function presentBuckets<R>(rows: readonly R[], key: (r: R) => string, label: (r: R) => string, last?: string) {
  const labels: Record<string, string> = {};
  for (const r of rows) if (key(r)) labels[key(r)] = label(r);
  const keys = Object.keys(labels).sort(
    (a, b) => Number(a === last) - Number(b === last) || labels[a].localeCompare(labels[b], undefined, { numeric: true }),
  );
  return { keys, labels };
}
