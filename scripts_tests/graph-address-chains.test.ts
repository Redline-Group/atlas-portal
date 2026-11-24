// Which chain one doc places an address on (doc-address-chains.ts), and the
// chains a mentions edge lands on: an ICD param doc's on its has_address
// nodes, any other doc's own placements, a guess kept only where the address
// is present on chain, and the primary chain when nothing is left.
import { describe, expect, it } from "vitest";
import { docAddressChains, docPlacements, titleChainFor } from "../scripts/lib/doc-address-chains.ts";
import { formatParam } from "../scripts/lib/graph-param-format.ts";
// @ts-expect-error — .mjs without types; runtime-only import.
import { pattern as mentions } from "../scripts/lib/graph-entity-edges/mentions.mjs";

const [A, B, C, D] = ["a", "b", "c", "d"].map((h) => "0x" + h.repeat(40));
const SOL = "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj";

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

describe("docPlacements", () => {
  it("places every occurrence, so one address on two chains in one doc gets both, a clause marked stated", () => {
    const placed = docPlacements(`The Safe on Base is ${A}. The Safe on Arbitrum is ${A}.`, "avalanche");
    expect(placed[A]).toEqual([{ chain: "base", stated: true }, { chain: "arbitrum", stated: true }]);
  });
  it("falls back to the heading for a bare address, unstated, and places a Solana address on solana", () => {
    expect(docPlacements(`${A} and ${SOL}`, "avalanche")).toEqual({ [A]: [{ chain: "avalanche", stated: false }], [SOL]: [{ chain: "solana", stated: true }] });
    expect(docPlacements(`${A}`, null)).toEqual({});
  });
});

/** The mentions edges `docs` get, as "doc_no address:chain". */
function mentionsOf(docs: { doc_no: string; title: string; content: string }[], addressesRaw: Record<string, object>, params: Record<string, [string, string, string]> = {}) {
  const allDocs = docs.map((d) => ({ ...d, id: d.doc_no, addressRefs: [...new Set(d.content.match(/0x[0-9a-f]{40}|7dHb\w+/g) ?? [])] }));
  const entityMap = new Map([["i", { entity_type: "instance", meta: JSON.stringify({ params }) }]]);
  const edges: string[] = [];
  const addEdge = (from: string, _ft: string, to: string) => edges.push(`${from} ${to}`);
  mentions.run({ allDocs, entityMap, docByDocNo: new Map(allDocs.map((d) => [d.doc_no, d])), addressesRaw, addEdge });
  return edges;
}

describe("mentions (2v)", () => {
  it("lands on the ICD's chain, else the doc's own, else the address's primary, else ethereum", () => {
    const edges = mentionsOf(
      [
        { doc_no: "A.1", title: "Token Address", content: `${A}` },
        { doc_no: "A.2", title: "ALM Proxy (Avalanche) Contract", content: `${A} ${B}` },
        { doc_no: "A.3", title: "Notes", content: `${C} ${D}` },
      ],
      { [C]: { chain: "plume" } },
      { "Token Address (Base)": [A, "u", "A.1"] },
    );
    expect(edges).toEqual([`A.1 ${A}:base`, `A.2 ${A}:avalanche`, `A.2 ${B}:avalanche`, `A.3 ${C}:plume`, `A.3 ${D}:ethereum`]);
  });
  it("meets a has_address node on ethereum when the ICD names no chain, whatever the doc's heading says", () => {
    const edges = mentionsOf([{ doc_no: "A.1", title: "Pool Address (Avalanche)", content: `${A}` }], {}, { "Pool Address": [A, "u", "A.1"] });
    expect(edges).toEqual([`A.1 ${A}:ethereum`]);
  });
  it("gives a param doc one edge per chain its expanded Token Address keys state", () => {
    const params = { "Token Address (Base)": [A, "u", "A.1"], "Token Address (Arbitrum)": [A, "u", "A.1"] } as Record<string, [string, string, string]>;
    expect(mentionsOf([{ doc_no: "A.1", title: "Token Address", content: `${A}` }], {}, params)).toEqual([`A.1 ${A}:base`, `A.1 ${A}:arbitrum`]);
  });
  it("keeps a heading's guess only on a chain the address is present on, and a stated chain always", () => {
    const docs = [
      { doc_no: "A.7", title: "Avalanche Instance Configuration Document", content: "" },
      { doc_no: "A.7.2", title: "Address", content: `${A}` },
      { doc_no: "A.8", title: "Base Contracts", content: `${B}` },
      { doc_no: "A.9", title: "Avalanche Contracts", content: `The receiver on Robinhood Chain is ${C}` },
    ];
    const raw = { [A]: { chain: "ethereum", presentOnChains: ["ethereum"] }, [B]: { chain: "ethereum", presentOnChains: ["ethereum", "base"] }, [C]: { chain: "ethereum", presentOnChains: ["ethereum"] } };
    expect(mentionsOf(docs, raw)).toEqual([`A.7.2 ${A}:ethereum`, `A.8 ${B}:base`, `A.9 ${C}:robinhood`]);
    expect(mentionsOf(docs.slice(0, 2), { [A]: { chain: "ethereum" } })).toEqual([`A.7.2 ${A}:avalanche`]);
  });
});

describe("formatParam", () => {
  it("reads a suffixed address key's value as its bare key's would be, and leaves other suffixed keys alone", () => {
    expect(formatParam("Underlying Asset Address (USDC)", `The USDC address is \`${A}\`.`)).toBe(A);
    expect(formatParam("Underlying Asset Address", `The USDC address is \`${A}\`.`)).toBe(A);
    expect(formatParam("Name (Legal)", "`Acme`")).toBe("Acme");
  });
});
