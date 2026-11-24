// A deployment's context: each prime's artifact and instances read by doc
// number from their UUIDs (parentId stops at heading depth 6), a Halo found by
// its entity's defining doc, an instance outside its prime's artifact still its
// prime's, no atlas for a prime that was not read, and the addresses a snapshot
// holds outside its rate limits.
import { afterAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { PauSnapshot } from "../../lib/pau.ts";
import { atlasContexts, snapshotAddresses } from "./key-context.ts";

const [A, B, C, D, E, GEM] = ["0x" + "a".repeat(40), "0x" + "B".repeat(40), "0x" + "c".repeat(40), "0x" + "d".repeat(40), "0x" + "e".repeat(40), "0x" + "9".repeat(40)];
const node = (id: string, doc_no: string, content: string, parentId: string | null = null) => ({ id, doc_no, title: id, type: "Core", depth: 6, parentId, order: 0, content, addressRefs: [] });

describe("atlasContexts", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "key-context-"));
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));
  const graph = path.join(dir, "graph.json");
  const [shallow, deep] = [path.join(dir, "docs-shallow.json"), path.join(dir, "docs-deep.json")];
  fs.writeFileSync(graph, JSON.stringify({ entities: [
    { id: "prime", entity_type: "agent", defining_doc_id: "prime", meta: null },
    { id: "inst", entity_type: "instance", defining_doc_id: "i1", meta: JSON.stringify({ agent_doc_id: "prime", params: {} }) },
    { id: "away", entity_type: "instance", defining_doc_id: "i2", meta: { agent_doc_id: "prime", params: {} } },
    { id: "halo", entity_type: "halo", defining_doc_id: "h1", meta: null },
  ] }));
  // The split files hold their nodes as an array, as build-index writes them.
  fs.writeFileSync(shallow, JSON.stringify({ nodes: [node("prime", "A.6.1", ""), node("h1", "A.1.4", `Facility ${E}`)] }));
  fs.writeFileSync(deep, JSON.stringify({ nodes: [
    node("i1", "A.6.1.2.3", "", "prime"),
    node("i1-addr", "A.6.1.2.3.2.1", `Token ${B}`, "prime"),
    node("other", "A.6.1.4.1", `RateLimits ${C} and ${A}`, "prime"),
    node("i2", "A.9.2", `Elsewhere ${D}`),
  ] }));

  it("reads each prime's artifact and instances by doc number, and an instance outside its artifact as its prime's", () => {
    const got = atlasContexts(graph, [shallow, deep], ["prime", "halo"]);
    expect(new Set(got.get("prime")!.addresses)).toEqual(new Set([B.toLowerCase(), C, A, D]));
    expect(got.get("prime")!.instances.map((i) => i.sort())).toEqual([[B.toLowerCase()], [D]]);
    expect(got.get("halo")).toEqual({ addresses: [E], instances: [] });
  });
  it("throws when the graph or a docs file is missing, so no prime gets an atlas that was not read", () => {
    expect(() => atlasContexts(path.join(dir, "none.json"), [shallow, deep], ["prime"])).toThrow("none.json not found");
    expect(() => atlasContexts(graph, [shallow, path.join(dir, "none-docs.json")], ["prime"])).toThrow("none-docs.json not found");
  });
  it("leaves out a prime whose artifact is not in the docs", () => {
    expect([...atlasContexts(graph, [shallow, deep], ["prime", "gone"]).keys()]).toEqual(["prime"]);
  });
});

describe("snapshotAddresses", () => {
  it("reads the contracts and their reads but not the rate-limit keys", () => {
    const snap = { contracts: [
      { role: "nfatFacility", address: A, facility: { gem: GEM } },
      { role: "rateLimits", address: C, rateLimits: [{ key: "0x" + "1".repeat(64), derived: { args: [B] } }] },
    ] } as unknown as PauSnapshot;
    expect(snapshotAddresses(snap).sort()).toEqual([A, C, GEM].sort());
  });
});
