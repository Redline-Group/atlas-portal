import { describe, it, expect } from "vitest";
import { NO_EXECUTOR, NO_OWNER, ownershipResolver, presentOwners, slugify, type Ownership } from "./mistakeOwnership";
import type { AtlasNode, GraphEntity, RelationEdge } from "../types";

const doc = (id: string, doc_no: string, title: string, parentId: string | null): AtlasNode =>
  ({ id, doc_no, title, type: "Core", depth: 1, parentId, content: "", order: 0, addressRefs: [] }) as AtlasNode;

const ent = (id: string, slug: string, name: string, st: string, did: string): GraphEntity =>
  ({ id, slug, name, et: "agent", st, did }) as GraphEntity;

const DOCS: Record<string, AtlasNode> = {
  gov: doc("gov", "A.1", "The Governance Scope", null),
  govLeaf: doc("govLeaf", "A.1.2", "Something", "gov"),
  agentScope: doc("agentScope", "A.6", "The Agent Scope", null),
  spark: doc("spark", "A.6.1.1.1", "Spark", "agentScope"),
  sparkLeaf: doc("sparkLeaf", "A.6.1.1.1.2.3", "Spark Leaf", "spark"),
  amatsu: doc("amatsu", "A.6.1.2.1", "Operational Executor Agent Amatsu", "agentScope"),
  amatsuLeaf: doc("amatsuLeaf", "A.6.1.2.1.1", "Facilitator", "amatsu"),
  orphanPrime: doc("orphanPrime", "A.6.1.1.9", "Lonely", "agentScope"),
};

const GRAPH: { participants: GraphEntity[]; edges: RelationEdge[] } = {
  participants: [
    ent("e-spark", "spark", "Spark", "prime", "spark"),
    ent("e-amatsu", "amatsu", "Amatsu", "operational_executor", "amatsu"),
    ent("e-lonely", "lonely", "Lonely", "prime", "orphanPrime"),
  ],
  edges: [{ f: "e-amatsu", ft: "entity", t: "e-spark", tt: "entity", e: "operational_executor_agent_for", s: [] } as RelationEdge],
};

describe("ownershipResolver", () => {
  const own = ownershipResolver(DOCS, GRAPH);

  it("resolves a Scope document to its root and no executor agent", () => {
    expect(own("govLeaf")).toEqual({
      scope: "the-governance-scope",
      scopeLabel: "A.1 Governance",
      agent: "",
      executor: NO_EXECUTOR,
      executorLabel: "No executor agent",
    });
  });

  it("resolves a Prime artifact document to the Prime's executor agent", () => {
    expect(own("sparkLeaf")).toMatchObject({ scope: "the-agent-scope", agent: "Spark", executor: "amatsu", executorLabel: "Amatsu" });
  });

  it("assigns an executor's own artifact to that executor", () => {
    expect(own("amatsuLeaf")).toMatchObject({ agent: "Amatsu", executor: "amatsu" });
  });

  it("keeps the agent but no executor when the graph names none for that Prime", () => {
    expect(own("orphanPrime")).toMatchObject({ agent: "Lonely", executor: NO_EXECUTOR });
  });

  it("returns null for a missing or absent UUID", () => {
    expect(own("gone")).toBeNull();
    expect(own(null)).toBeNull();
  });

  it("without a graph, still resolves the scope but leaves the executor unknown", () => {
    expect(ownershipResolver(DOCS, null)("sparkLeaf")).toMatchObject({
      scope: "the-agent-scope",
      agent: "",
      executor: "",
    });
  });
});

describe("slugify", () => {
  it("lower-cases and hyphenates", () => {
    expect(slugify("The Governance Scope")).toBe("the-governance-scope");
  });
});

describe("presentOwners", () => {
  const owned = (executor: string, executorLabel: string, scope = "", scopeLabel = ""): Ownership => ({
    ...NO_OWNER,
    executor,
    executorLabel,
    scope,
    scopeLabel,
  });

  it("orders executors by name with 'no executor agent' last, and skips unresolved rows", () => {
    const rows = [owned("none", "No executor agent"), owned("ozone", "Ozone"), owned("amatsu", "Amatsu"), NO_OWNER];
    expect(presentOwners(rows, "executor").keys).toEqual(["amatsu", "ozone", "none"]);
  });

  it("orders scopes by their leading doc number, numerically", () => {
    const rows = [owned("", "", "x", "A.10 Ten"), owned("", "", "y", "A.2 Two")];
    expect(presentOwners(rows, "scope")).toEqual({ keys: ["y", "x"], labels: { x: "A.10 Ten", y: "A.2 Two" } });
  });
});
