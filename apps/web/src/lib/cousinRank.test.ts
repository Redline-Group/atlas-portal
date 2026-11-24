import { describe, it, expect } from "vitest";
import { rankCousins, MAX_COUSINS } from "./cousinRank";
import { makeNode, makeAtlasBundle } from "../test/fixtures";

const spark = makeNode({ id: "s", doc_no: "A.6.1.1.1", title: "Spark" });
const grove = makeNode({ id: "g", doc_no: "A.6.1.1.2", title: "Grove" });
const target = makeNode({ id: "t", doc_no: "A.6.1.1.1.2.1", title: "Spark Liquidity Layer Addresses" });
const doc = (id: string, doc_no: string, title: string) => makeNode({ id, doc_no, title });
const docs = (...nodes: ReturnType<typeof makeNode>[]) => makeAtlasBundle([spark, grove, target, ...nodes]).docs;

describe("rankCousins", () => {
  it("ranks by name first (same, same but the agent's, different), then own prime, then status", () => {
    const same = doc("same", "A.6.1.1.2.9", "Spark Liquidity Layer Addresses");
    const agentOwn = doc("agent-own", "A.6.1.1.1.9", "Spark Liquidity-Layer Addresses");
    const agent = doc("agent", "A.6.1.1.2.8", "Grove Liquidity Layer Addresses");
    const otherOwn = doc("other-own", "A.6.1.1.1.8", "Allocator Contract Addresses");
    const otherDone = doc("other-done", "A.6.1.1.2.6", "ALM Contracts");
    const other = doc("other", "A.6.1.1.2.7", "Monolithic ALM Contracts");
    const m = (node: typeof same, own: boolean, completed = false) => ({ node, own, completed });
    const ranked = rankCousins(docs(same, agentOwn, agent, otherOwn, otherDone, other), target, [
      m(otherDone, false, true), m(other, false), m(agent, false), m(otherOwn, true), m(agentOwn, true), m(same, false),
    ]);
    expect(ranked.map((r) => r.node.id)).toEqual(["same", "agent-own", "agent", "other-own", "other", "other-done"]);
  });

  it(`keeps the best ${MAX_COUSINS}`, () => {
    const many = Array.from({ length: 30 }, (_, i) => doc(`d${i}`, `A.6.1.1.2.${i + 10}`, i === 29 ? target.title : `Other ${i}`));
    const ranked = rankCousins(docs(...many), target, many.map((node) => ({ node, own: false, completed: false })));
    expect(ranked).toHaveLength(MAX_COUSINS);
    expect(ranked[0].node.id).toBe("d29");
  });
});
