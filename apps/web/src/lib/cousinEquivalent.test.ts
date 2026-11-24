import { describe, it, expect } from "vitest";
import { equivalentDoc } from "./cousinTitles";
import { contradicts, isChainHeading, pathMarks } from "./cousinPaths";
import { makeNode, makeAtlasBundle } from "../test/fixtures";

// Two prime artifacts (Spark A.6.1.1.1, Grove A.6.1.1.2), each with a primitive
// root at .2.6.1; docs are given relative to that root.
function atlas(spark: [string, string, string?][], grove: [string, string, string?][]) {
  const nodes = [makeNode({ id: "s", doc_no: "A.6.1.1.1", title: "Spark" }), makeNode({ id: "g", doc_no: "A.6.1.1.2", title: "Grove" })];
  const add = (prefix: string, id: string) => ([rel, title, content = ""]: [string, string, string?]) =>
    nodes.push(makeNode({ id: `${id}${rel}`, doc_no: `${prefix}${rel}`, title, content }));
  add("A.6.1.1.1.2.6.1", "s")(["", "Allocation System Primitive"]);
  add("A.6.1.1.2.2.6.1", "g")(["", "Allocation System Primitive"]);
  spark.forEach(add("A.6.1.1.1.2.6.1", "s"));
  grove.forEach(add("A.6.1.1.2.2.6.1", "g"));
  const bundle = makeAtlasBundle(nodes);
  const find = (sparkRel: string) => {
    const target = bundle.docs[`s${sparkRel}`];
    return equivalentDoc(bundle, target, sparkRel, bundle.docs["g"])?.id ?? null;
  };
  const findBack = (groveRel: string) => {
    const target = bundle.docs[`g${groveRel}`];
    return equivalentDoc(bundle, target, groveRel, bundle.docs["s"])?.id ?? null;
  };
  return { find, findBack };
}

describe("equivalentDoc", () => {
  it("follows the parent's title when primes order their sections differently", () => {
    const { find } = atlas(
      [[".2", "Core Operator Relayer Multisig"], [".2.1", "Address"], [".3", "Freezer Multisig"], [".3.1", "Address"]],
      [[".2", "Freezer Multisig"], [".2.1", "Address"], [".3", "Core Operator Relayer Multisig"], [".3.1", "Address"]],
    );
    expect(find(".2.1")).toBe("g.3.1");
    expect(find(".3.1")).toBe("g.2.1");
  });

  it("never takes a lone same-titled doc under another parent", () => {
    const { find } = atlas(
      [[".2", "Deposit Into Aave"], [".2.1", "Relayer Role"]],
      [[".5", "Role Hierarchy And Permissions"], [".5.1", "Relayer Role"]],
    );
    expect(find(".2.1")).toBeNull();
  });

  it("rejects a path on another chain, and sets aside a heading that only names one", () => {
    const { find } = atlas(
      [[".1", "Arbitrum"], [".1.1", "Controller Contract"], [".2", "Allocator Contract Addresses"], [".2.1", "Allocator Registry Contract"]],
      [[".1", "Ethereum Mainnet"], [".1.1", "Controller Contract"], [".2", "Allocator Contract Addresses"], [".2.1", "Ethereum Mainnet"], [".2.1.1", "Allocator Registry Contract"]],
    );
    expect(find(".1.1")).toBeNull();
    expect(find(".2.1")).toBe("g.2.1.1");
  });

  it("rejects a folder under another status heading", () => {
    const { find } = atlas(
      [[".3", "Active Instances"], [".3.1", "Base"], [".3.1.1", "Morpho"]],
      [[".1", "Active Instances Directory"], [".1.1", "Base"], [".1.1.1", "Morpho"]],
    );
    expect(find(".3.1.1")).toBeNull();
  });
});

describe("equivalentDoc — same-titled siblings", () => {
  it("lets the sibling whose text is closest claim the cousin, both ways", () => {
    const steps = "In order to withdraw all ERC-4626 balances, the operator must execute the following action";
    const { find, findBack } = atlas(
      [[".4", "Redeem All Mainnet Positions"], [".4.1", "ERC-4626 Withdrawal Action", steps], [".4.2", "ERC-4626 Withdrawal Action", "[General Redeem from ERC-4626 Tokens Procedure](x)"]],
      [[".2", "Redeem All Mainnet Positions"], [".2.1", "ERC-4626 Withdrawal Action", steps]],
    );
    expect(findBack(".2.1")).toBe("s.4.1");
    expect(find(".4.1")).toBe("g.2.1");
    // The link-only duplicate does not also claim Grove's doc.
    expect(find(".4.2")).toBeNull();
  });
});

describe("cousinPaths", () => {
  it("knows a heading that only names a chain", () => {
    for (const t of ["Ethereum Mainnet", "Base", "Robinhood Chain", "Ethereum Mainnet Instances", "X Layer"]) expect(isChainHeading(t)).toBe(true);
    for (const t of ["Ethereum Mainnet USDS", "Solana Multisigs And Addresses", "Morpho", "Active Instances", "Mainnet Controller Contract Functions"]) {
      expect(isChainHeading(t)).toBe(false);
    }
  });

  it("reads an unnamed chain as Ethereum Mainnet, and Foreign as its own", () => {
    const key = (t: string | undefined) => (t ?? "").toLowerCase();
    const none = pathMarks(["ALM Contracts"], key);
    expect(contradicts(none, pathMarks(["Ethereum Mainnet", "ALM Contracts"], key))).toBe(false);
    expect(contradicts(none, pathMarks(["Base", "ALM Contracts"], key))).toBe(true);
    expect(contradicts(pathMarks(["Relayer Functions", "Foreign Controller Contract Functions"], key), pathMarks(["Relayer Functions", "Mainnet Controller Contract Functions"], key))).toBe(true);
  });
});
