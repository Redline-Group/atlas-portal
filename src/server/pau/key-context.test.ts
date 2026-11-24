// A deployment's context: the addresses the atlas states for each prime (its own
// parameters and its instances'), the addresses a snapshot holds outside its
// rate limits (an NFAT Facility's gem among them), and the ordered pairs built
// from both plus a spell's stated pairs.
import { afterAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { PauSnapshot } from "../../lib/pau.ts";
import { atlasAddressesByPrime, contextPairs, snapshotAddresses } from "./key-context.ts";

const [A, B, C, GEM] = ["0x" + "a".repeat(40), "0x" + "B".repeat(40), "0x" + "c".repeat(40), "0x" + "9".repeat(40)];

describe("atlasAddressesByPrime", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "key-context-"));
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "graph.json");
  fs.writeFileSync(file, JSON.stringify({ entities: [
    { id: "prime", entity_type: "agent", meta: { params: { "Controller": [A, "uuid", "A.1"] } } },
    { id: "i1", entity_type: "instance", meta: JSON.stringify({ agent_doc_id: "prime", params: { "Token Address": [B, "u", "A.2"], "Pool": [A, "u", "A.3"] } }) },
    { id: "i2", entity_type: "instance", meta: { params: { "Token Address": [C, "u", "A.4"] } } },
  ] }));

  it("gathers each prime's own and its instances' addresses, lowercased and once each, and skips an instance with no prime", () => {
    expect(atlasAddressesByPrime(file)).toEqual(new Map([["prime", [A, B.toLowerCase()]]]));
  });
  it("is empty without a graph", () => {
    expect(atlasAddressesByPrime(path.join(dir, "missing.json")).size).toBe(0);
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

describe("contextPairs", () => {
  it("pairs every two distinct addresses both ways, then adds the stated pairs", () => {
    expect(contextPairs([A, B, A], [`${C},${A}`])).toEqual([[A, B.toLowerCase()], [B.toLowerCase(), A], [C, A]]);
  });
});
