// The chain a multisig's has_address edge and meta.chain take
// (scripts/lib/graph-multisigs.mjs): the "address of … on <Chain> is" clause
// when its address doc has one, else the chains a mentions edge from that doc
// lands on (docChains): a heading guess only where the address is present on
// chain, else the address's primary chain, never a bare ethereum default.
import { describe, expect, it, vi, afterEach } from "vitest";
// @ts-expect-error — .mjs without types; runtime-only import.
import { extractMultisigs } from "../scripts/lib/graph-multisigs.mjs";
import { makeEntity } from "../scripts/lib/graph-patterns.mjs";

afterEach(() => vi.restoreAllMocks());

const SAFE = "0x0eec86649e756a23cbc68d9efed756f16ad5f85f";
const doc = (doc_no: string, title: string, content = "") => ({ id: doc_no, doc_no, title, type: "Core", depth: 6, parentId: null, order: 0, content, addressRefs: [] });

/** One multisig root under `heading`, its address doc saying `address`; returns its entity's chain and its has_address node ids. */
function multisig(address: string, addressesRaw: Record<string, object>, heading = "Multisigs") {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const docs = [
    doc("A.9.1", heading),
    doc("A.9.1.1", "Relayer Multisig"),
    doc("A.9.1.1.1", "Address", address),
    doc("A.9.1.1.2", "Required Number Of Signers", "The Relayer Multisig has a 2/3 signing requirement."),
    doc("A.9.1.1.3", "Signers", "The signers are three (3) addresses controlled by Soter Labs."),
  ];
  const entityMap = new Map<string, any>();
  const edges: any[] = [];
  const addEntity = (slug: string, name: string, type: string, subtype: string | null, defining_doc_id: string | null, meta: unknown) =>
    entityMap.get(slug) ?? entityMap.set(slug, makeEntity(slug, name, type, { subtype, defining_doc_id, meta })).get(slug);
  extractMultisigs(docs, new Map(docs.map((d) => [d.id, d])), new Map(docs.map((d) => [d.doc_no, d])), entityMap, edges, addressesRaw).run(addEntity);
  const ent = entityMap.get("relayer-multisig");
  return { chain: JSON.parse(ent.meta).chain, nodes: edges.filter((e) => e.edgeType === "has_address").map((e) => e.toId) };
}

describe("multisig chains", () => {
  it("takes the chain its address doc's clause names, whatever the address's primary", () => {
    const got = multisig(`The address of the Relayer Multisig on Base is \`${SAFE}\`.`, { [SAFE]: { chain: "avalanche" } });
    expect(got).toEqual({ chain: "base", nodes: [`${SAFE}:base`] });
  });
  it("takes the address's primary chain when its doc names none, not ethereum", () => {
    const got = multisig(`The address of the Relayer Multisig is \`${SAFE}\`.`, { [SAFE]: { chain: "avalanche", presentOnChains: ["avalanche", "base"] } });
    expect(got).toEqual({ chain: "avalanche", nodes: [`${SAFE}:avalanche`] });
  });
  it("keeps a heading's chain only where the address is present on chain", () => {
    const bare = `The address of the Relayer Multisig is \`${SAFE}\`.`;
    expect(multisig(bare, { [SAFE]: { chain: "avalanche", presentOnChains: ["avalanche", "base"] } }, "Base Multisigs").chain).toBe("base");
    expect(multisig(bare, { [SAFE]: { chain: "avalanche", presentOnChains: ["avalanche"] } }, "Base Multisigs").chain).toBe("avalanche");
    expect(multisig(bare, { [SAFE]: { chain: "avalanche" } }, "Base Multisigs").chain).toBe("base");
  });
  it("puts a Solana address on solana", () => {
    const sol = "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj";
    expect(multisig(`The address of the Relayer Multisig is \`${sol}\`.`, {})).toEqual({ chain: "solana", nodes: [`${sol}:solana`] });
  });
});
