// Sky Core Halo extraction (scripts/lib/graph-halos.ts) and its two edge
// patterns, on the document shape of the Governance Scope's halo list.
import { describe, it, expect, vi } from "vitest";
import { buildChildrenIndex } from "../scripts/lib/graph-instances.mjs";
import { makeEntity } from "../scripts/lib/graph-patterns.mjs";
import { addSkyCoreHalos, skyCoreHaloParams } from "../scripts/lib/graph-halos.ts";
import { pattern as haloExecutorFor } from "../scripts/lib/graph-entity-edges/halo-executor-for.ts";
import { pattern as agentContractAddress } from "../scripts/lib/graph-entity-edges/agent-contract-address.ts";

const OZONE = "565660dd-7850-4c3a-8dba-554542bf103a";
const SUB = "0xF12Be1673758f8fBC275755401774Ec45C80c0F0";
const GUARD = "0x5dc7A3700Dc0508f5E127FA23acd83cc2E1D6056";
const doc = (id: string, doc_no: string, title: string, content = "") => ({ id, doc_no, title, content, type: "Core" });

const docs = [
  doc("section", "A.1.14.6", "Sky Core Halos", "The documents herein define Sky Core Halos."),
  doc("rule", "A.1.14.6.2.2", "Operational Executor Agent For Sky Core Halos", `Sky Core Halos are operated by Operational Executor Agent Ozone. See [A.6.1.2.2 - Operational Executor Agent Ozone](${OZONE}).`),
  doc("list", "A.1.14.6.3", "List Of Sky Core Halos", "The documents herein list and specify each Sky Core Halo."),
  doc("halo", "A.1.14.6.3.1", "Test Halo", "The documents herein specify Test Halo."),
  doc("sub", "A.1.14.6.3.1.1", "Test Halo SubProxy Account", `The address of Test Halo's SubProxy Account on the Ethereum Mainnet is \`${SUB}\`.`),
  doc("guard", "A.1.14.6.3.1.2", "Test Halo StarGuard Contract", `The address of Test Halo's StarGuard contract on the Ethereum Mainnet is \`${GUARD}\`.`),
  doc("delay", "A.1.14.6.3.1.2.1", "Test Halo StarGuard Max Delay", "The Test Halo StarGuard `maxDelay` is seven (7) days."),
];
const children = buildChildrenIndex(docs);

function entities() {
  const map = new Map<string, any>();
  const add = (slug: string, name: string, entity_type: string, subtype: string, defining_doc_id: string, meta: object) => {
    const e = { ...makeEntity(slug, name, entity_type, { subtype, defining_doc_id, meta }), id: slug };
    map.set(slug, e);
    return e;
  };
  return { map, add };
}

function context(map: Map<string, any>) {
  const edges: any[] = [];
  const byDoc = new Map([...map.values()].map((e) => [e.defining_doc_id, e]));
  const addEdge = (fromId: string, _ft: string, toId: string, _tt: string, edgeType: string, sourceDocNos: string[], meta: string | null = null) => edges.push({ fromId, toId, edgeType, sourceDocNos, meta });
  return { ctx: { allDocs: docs, entityMap: map, entityByDocId: byDoc, addEdge }, edges };
}

describe("Sky Core Halos", () => {
  it("reads a halo's contracts under the Agent Creation param keys", () => {
    expect(skyCoreHaloParams(docs[3], children)).toEqual({
      "SubProxy Account / Ethereum Mainnet": [SUB, "sub", "A.1.14.6.3.1.1"],
      "StarGuard Contract / Ethereum Mainnet": [GUARD, "guard", "A.1.14.6.3.1.2"],
      "StarGuard Max Delay": ["The Test Halo StarGuard `maxDelay` is seven (7) days.", "delay", "A.1.14.6.3.1.2.1"],
    });
  });

  it("adds one agent/halo entity per listed halo, with the document's UUID as its id", () => {
    const { map, add } = entities();
    expect(addSkyCoreHalos(docs, children, add)).toBe(1);
    expect(map.get("test-halo")).toMatchObject({ id: "halo", name: "Test Halo", entity_type: "agent", subtype: "halo" });
  });

  it("warns when halo documents exist but the list is gone, and stays silent with none at all", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const renamed = docs.map((d) => (d.id === "list" ? { ...d, title: "Sky Core Halo Register" } : d));
    expect(addSkyCoreHalos(renamed, buildChildrenIndex(renamed), entities().add)).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[drift] tripwire"));
    warn.mockClear();
    expect(addSkyCoreHalos([doc("x", "A.1", "Governance")], new Map(), entities().add)).toBe(0);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("links the cited Operational Executor Agent to every Sky Core Halo", () => {
    const { map, add } = entities();
    addSkyCoreHalos(docs, children, add);
    add("ozone", "Ozone", "agent", "operational_executor", OZONE, {});
    const { ctx, edges } = context(map);
    haloExecutorFor.run(ctx);
    expect(edges).toEqual([{ fromId: "ozone", toId: "halo", edgeType: "operational_executor_agent_for", sourceDocNos: ["A.1.14.6.2.2"], meta: null }]);
  });

  it("warns when halos exist but the executor rule is gone", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { map, add } = entities();
    addSkyCoreHalos(docs, children, add);
    const { ctx, edges } = context(map);
    haloExecutorFor.run({ ...ctx, allDocs: docs.filter((d) => d.id !== "rule") });
    expect(edges).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[drift] tripwire"));
    warn.mockRestore();
  });

  it("links an agent to its SubProxy and StarGuard, from its own params or its Agent Creation instance's", () => {
    const { map, add } = entities();
    addSkyCoreHalos(docs, children, add);
    add("spark", "Spark", "agent", "prime", "spark-doc", {});
    add("spark-creation", "Spark's Instance", "instance", "agent-creation", "icd", { agent_doc_id: "spark-doc", params: { "StarGuard Contract / Ethereum Mainnet": [GUARD, "g", "A.6.1.1.1.2.1.1.3.1.1.3"], "StarGuard Max Delay": ["7 days", "d", "A.6"] } });
    const { ctx, edges } = context(map);
    agentContractAddress.run(ctx);
    expect(edges.map((e) => [e.fromId, e.toId, JSON.parse(e.meta).role])).toEqual([
      ["halo", `${SUB.toLowerCase()}:ethereum`, "subproxy"],
      ["halo", `${GUARD.toLowerCase()}:ethereum`, "starguard"],
      ["spark", `${GUARD.toLowerCase()}:ethereum`, "starguard"],
    ]);
  });
});
