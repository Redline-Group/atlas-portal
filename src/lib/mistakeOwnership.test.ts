import { describe, it, expect } from "vitest";
import { NO_EXECUTOR, NO_OWNER, ownershipResolver, presentBuckets, type Ownership } from "./mistakeOwnership";
import type { AtlasNode, GraphEntity, RelationEdge } from "../types";

const doc = (id: string, doc_no: string, title: string, parentId: string | null = null): AtlasNode =>
  ({ id, doc_no, title, type: "Core", depth: 1, parentId, content: "", order: 0, addressRefs: [] }) as AtlasNode;

const agent = (id: string, slug: string, name: string, st: string, did: string): GraphEntity =>
  ({ id, slug, name, et: "agent", st, did }) as GraphEntity;

const DOCS: Record<string, AtlasNode> = Object.fromEntries(
  [
    doc("gov", "A.1", "The Governance Scope"),
    doc("govLeaf", "A.1.2", "Something", "gov"),
    doc("agentScope", "A.6", "The Agent Scope"),
    doc("spark", "A.6.1.1.1", "Spark", "agentScope"),
    doc("sparkLeaf", "A.6.1.1.1.2.3", "Spark Leaf", "spark"),
    doc("amatsu", "A.6.1.2.1", "Operational Executor Agent Amatsu", "agentScope"),
    doc("amatsuLeaf", "A.6.1.2.1.1", "Facilitator", "amatsu"),
    doc("lonely", "A.6.1.1.9", "Lonely", "agentScope"),
  ].map((d) => [d.id, d]),
);

const GRAPH: { participants: GraphEntity[]; edges: RelationEdge[] } = {
  participants: [
    agent("e-spark", "spark", "Spark", "prime", "spark"),
    agent("e-amatsu", "amatsu", "Amatsu", "operational_executor", "amatsu"),
    agent("e-lonely", "lonely", "Lonely", "prime", "lonely"),
  ],
  edges: [{ f: "e-amatsu", ft: "entity", t: "e-spark", tt: "entity", e: "operational_executor_agent_for", s: [] } as RelationEdge],
};

describe("ownershipResolver", () => {
  const own = ownershipResolver(DOCS, GRAPH);

  it("resolves a Scope document to its Scope and no executor agent", () => {
    expect(own("govLeaf")).toEqual({
      scope: "gov",
      scopeLabel: "A.1 Governance",
      agent: "",
      executor: NO_EXECUTOR,
      executorLabel: "",
      viaExecutor: false,
    });
  });

  it("resolves a Prime artifact document to the Prime's executor agent", () => {
    expect(own("sparkLeaf")).toMatchObject({ scope: "agentScope", agent: "Spark", executor: "amatsu", viaExecutor: true });
  });

  it("counts an agent's own root doc as part of its artifact", () => {
    expect(own("spark")).toMatchObject({ agent: "Spark", executor: "amatsu" });
  });

  it("assigns an executor's own artifact to that executor", () => {
    expect(own("amatsuLeaf")).toMatchObject({ agent: "Amatsu", executor: "amatsu", viaExecutor: false });
  });

  it("keeps the agent but no executor when the graph names none for that Prime", () => {
    expect(own("lonely")).toMatchObject({ agent: "Lonely", executor: NO_EXECUTOR });
  });

  it("places a Needed Research doc in the Scope of the doc it hangs off", () => {
    const docs = { ...DOCS, nr: doc("nr", "NR-7", "Open Question", "govLeaf") };
    expect(ownershipResolver(docs, GRAPH)("nr")).toMatchObject({ scope: "gov", scopeLabel: "A.1 Governance" });
  });

  it("without a graph, still resolves the scope but leaves the executor unknown", () => {
    expect(ownershipResolver(DOCS, null)("sparkLeaf")).toMatchObject({ scope: "agentScope", agent: "", executor: "" });
  });
});

describe("presentBuckets", () => {
  const owned = (executor: string, executorLabel: string, scope = "", scopeLabel = ""): Ownership => ({
    ...NO_OWNER,
    executor,
    executorLabel,
    scope,
    scopeLabel,
  });

  it("orders by label with the `last` key pinned at the end, skipping empty keys", () => {
    const rows = [owned(NO_EXECUTOR, ""), owned("ozone", "Ozone"), owned("amatsu", "Amatsu"), NO_OWNER];
    const out = presentBuckets(rows, (r) => r.executor, (r) => r.executorLabel || "None", NO_EXECUTOR);
    expect(out.keys).toEqual(["amatsu", "ozone", NO_EXECUTOR]);
    expect(out.labels[NO_EXECUTOR]).toBe("None");
  });

  it("orders doc_no-led labels numerically", () => {
    const rows = [owned("", "", "x", "A.10 Ten"), owned("", "", "y", "A.2 Two")];
    expect(presentBuckets(rows, (r) => r.scope, (r) => r.scopeLabel).keys).toEqual(["y", "x"]);
  });
});
