// Which role, label and chain an ICD param gives the address it holds
// (graph-icd-params.ts), which chain one doc places an address on
// (doc-address-chains.ts), and the chain a mentions edge lands on.
import { describe, expect, it } from "vitest";
import { docAddressChains, titleChainFor } from "../scripts/lib/doc-address-chains.ts";
import { icdLabelRank, icdParamAddress, icdParamChain, icdParamLabel, icdParamRole, icdStatedChains } from "../scripts/lib/graph-icd-params.ts";
// @ts-expect-error — .mjs without types; runtime-only import.
import { pattern as mentions } from "../scripts/lib/graph-entity-edges/mentions.mjs";

const [A, B, C, D] = ["a", "b", "c", "d"].map((h) => "0x" + h.repeat(40));
const p = (v: string) => [v, "uuid", "A.1"] as [string, string, string];

describe("icdParamRole", () => {
  it("reads a suffixed or collision-renamed key by its role, and keeps Token Address's own suffix", () => {
    expect(icdParamRole("Underlying Asset Address")).toBe("underlying-asset");
    expect(icdParamRole("Underlying Asset Address (USDC)")).toBe("underlying-asset");
    expect(icdParamRole("Contract Addresses / Underlying Asset Address")).toBe("underlying-asset");
    expect(icdParamRole("Pool Address (Curve)")).toBe("pool");
    expect(icdParamRole("Token Address (ERC4626 Vault)")).toBe("vault");
    expect(icdParamRole("Token Address (Base)")).toBe("token");
  });
  it("matches no key that only starts like a role key", () => {
    expect(icdParamRole("Underlying Asset Address Notes")).toBeNull();
    expect(icdParamRole("Address")).toBeNull();
  });
});

describe("icdParamLabel and icdLabelRank", () => {
  const params = { Token: p("sUSDS") };
  it("labels a suffixed underlying asset by the asset its suffix names", () => {
    expect(icdParamLabel("Underlying Asset Address (AUSD)", params, null, "Pool")).toBe("AUSD");
    expect(icdParamLabel("Underlying Asset Address", params, null, "Pool")).toBe("sUSDS underlying asset");
    expect(icdParamLabel("Contract Addresses / Underlying Asset Address", params, null, "Pool")).toBe("sUSDS underlying asset");
  });
  it("ranks exact role keys above suffixed and collision-renamed ones", () => {
    expect(icdLabelRank("Underlying Asset Address")).toBe(0);
    expect(icdLabelRank("Token Address (Base)")).toBe(0);
    expect(icdLabelRank("Underlying Asset Address (AUSD)")).toBe(1);
    expect(icdLabelRank("Contract Addresses / Underlying Asset Address")).toBe(1);
  });
});

describe("icdParamChain, icdParamAddress and icdStatedChains", () => {
  it("reads the chain from Token Address's suffix, else Network, else names none", () => {
    expect(icdParamChain("Token Address (Base)", {})).toBe("base");
    expect(icdParamChain("Underlying Asset Address (USDC)", { Network: p("Arbitrum") })).toBe("arbitrum");
    expect(icdParamChain("Token Address (ERC4626 Vault)", {})).toBeNull();
  });
  it("takes only a whole address under a role key", () => {
    expect(icdParamAddress("Pool Address", A.toUpperCase().replace("0X", "0x"))).toEqual({ addr: A, isSol: false });
    expect(icdParamAddress("Pool Address", `${A} (pool)`)).toBeNull();
    expect(icdParamAddress("Pool Name", A)).toBeNull();
  });
  it("maps each param doc to the chains its ICD states, leaving out an address whose ICD names none", () => {
    const meta = JSON.stringify({ params: {
      "Token Address (Base)": [A, "u", "A.1.1"],
      "Underlying Asset Address": [B, "u", "A.1.2"],
    } });
    const chains = icdStatedChains([{ entity_type: "instance", meta }, { entity_type: "agent", meta }]);
    expect([...chains]).toEqual([["A.1.1", new Map([[A, "base"]])]]);
  });
});

describe("titleChainFor and docAddressChains", () => {
  const docs = [
    { doc_no: "A.6", title: "Spark" },
    { doc_no: "A.6.1", title: "Base Mainnet" },
    { doc_no: "A.6.1.1", title: "ALM Proxy Contract" },
  ];
  const byDocNo = new Map(docs.map((d) => [d.doc_no, d]));
  it("reads the nearest doc_no ancestor's heading", () => {
    expect(titleChainFor(docs[2], byDocNo)).toBe("base");
    expect(titleChainFor(docs[0], byDocNo)).toBeNull();
  });
  it("places an address by prose, then heading, and marks the ethereum default as undetected", () => {
    expect(docAddressChains(`The address on Arbitrum is ${A}.`, "base")[A]).toEqual({ chain: "arbitrum", candidates: ["arbitrum"], detected: true });
    expect(docAddressChains(`${A}`, "base")[A]).toEqual({ chain: "base", candidates: ["base"], detected: true });
    expect(docAddressChains(`${A}`, null)[A]).toEqual({ chain: "ethereum", candidates: [], detected: false });
  });
});

describe("mentions (2v)", () => {
  it("lands on the ICD's chain, else the doc's own, else the address's primary, else ethereum", () => {
    const doc = (doc_no: string, title: string, content: string, addressRefs: string[]) => ({ id: doc_no, doc_no, title, content, addressRefs });
    const allDocs = [
      doc("A.1", "Token Address", `${A}`, [A]),
      doc("A.2", "ALM Proxy (Avalanche) Contract", `${A} ${B}`, [A, B]),
      doc("A.3", "Notes", `${C} ${D}`, [C, D]),
    ];
    const entityMap = new Map([["i", { entity_type: "instance", meta: JSON.stringify({ params: { "Token Address (Base)": [A, "u", "A.1"] } }) }]]);
    const edges: string[] = [];
    mentions.run({
      allDocs,
      entityMap,
      docByDocNo: new Map(allDocs.map((d) => [d.doc_no, d])),
      addressesRaw: { [C]: { chain: "plume" } },
      addEdge: (from: string, _ft: string, to: string) => edges.push(`${from} ${to}`),
    });
    expect(edges).toEqual([`A.1 ${A}:base`, `A.2 ${A}:avalanche`, `A.2 ${B}:avalanche`, `A.3 ${C}:plume`, `A.3 ${D}:ethereum`]);
  });
});
