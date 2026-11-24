// What an ICD param says about the address it holds (graph-icd-params.ts): the
// role its key names, the label and the chain it gives, the node its
// has_address edge points at, and how several params naming one address fold
// into one annotation whatever order the instances are read in.
import { describe, expect, it } from "vitest";
import {
  icdEdgeChain,
  icdLabelRank,
  icdParamAddress,
  icdParamChain,
  icdParamLabel,
  icdParamRole,
  icdStatedChains,
  mergeIcdAnnotation,
  type IcdAnnotation,
} from "../scripts/lib/graph-icd-params.ts";

const [A, B] = ["a", "b"].map((h) => "0x" + h.repeat(40));
const SOL = "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj";
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
    expect([icdLabelRank("Underlying Asset Address"), icdLabelRank("Token Address (Base)")]).toEqual([0, 0]);
    expect([icdLabelRank("Underlying Asset Address (AUSD)"), icdLabelRank("Contract Addresses / Underlying Asset Address")]).toEqual([1, 1]);
  });
});

describe("icdParamChain, icdParamAddress and icdEdgeChain", () => {
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
  it("points a has_address node at the named chain, else ethereum, and a Solana address at solana", () => {
    expect(icdEdgeChain({ addr: A, isSol: false }, "Token Address (Base)", {})).toBe("base");
    expect(icdEdgeChain({ addr: A, isSol: false }, "Pool Address", {})).toBe("ethereum");
    expect(icdEdgeChain({ addr: SOL, isSol: true }, "Token Address", { Network: p("Ethereum") })).toBe("solana");
  });
});

describe("icdStatedChains", () => {
  const entity = (entity_type: string, params: Record<string, [string, string, string]>) => ({ entity_type, meta: JSON.stringify({ params }) });
  it("gives each param doc the chains of its has_address nodes, the ethereum default included, for instances and invocations", () => {
    const chains = icdStatedChains([
      entity("instance", { "Token Address (Base)": [A, "u", "A.1.1"], "Underlying Asset Address": [B, "u", "A.1.2"] }),
      entity("invocation", { "Pool Address": [A, "u", "A.2.1"], Network: ["Avalanche", "u", "A.2.0"] }),
      entity("agent", { "Token Address": [B, "u", "A.3.1"] }),
    ]);
    expect([...chains].map(([doc, m]) => [doc, [...m].map(([a, c]) => [a, [...c]])])).toEqual([
      ["A.1.1", [[A, ["base"]]]],
      ["A.1.2", [[B, ["ethereum"]]]],
      ["A.2.1", [[A, ["avalanche"]]]],
    ]);
  });
  it("keeps every chain one leaf's expanded Token Address keys state for the same address", () => {
    const chains = icdStatedChains([entity("instance", { "Token Address (Base)": [A, "u", "A.1"], "Token Address (Arbitrum)": [A, "u", "A.1"], "Token Address (Solana)": [SOL, "u", "A.1"] })]);
    expect([...chains.get("A.1")!].map(([a, c]) => [a, [...c]])).toEqual([[A, ["base", "arbitrum"]], [SOL, ["solana"]]]);
  });
});

describe("mergeIcdAnnotation", () => {
  const exact = { role: "underlying-asset", label: "fsUSDS underlying asset", chain: "ethereum", rank: 0 };
  const suffixed = { role: "underlying-asset", label: "USDS", chain: "avalanche", rank: 1 };
  const fold = (...ps: (typeof exact)[]) => {
    const m = new Map<string, IcdAnnotation>();
    for (const x of ps) mergeIcdAnnotation(m, A, x);
    return m.get(A)!;
  };
  it("takes the label and the chain from the best-ranked key, in either order", () => {
    expect(fold(suffixed, exact)).toMatchObject({ entityLabel: "fsUSDS underlying asset", chain: "ethereum" });
    expect(fold(exact, suffixed)).toMatchObject({ entityLabel: "fsUSDS underlying asset", chain: "ethereum" });
  });
  it("takes the chain from the best-ranked key that names one, in either order", () => {
    const silent = { ...exact, chain: null as unknown as string };
    expect(fold(silent, suffixed)).toMatchObject({ entityLabel: exact.label, chain: "avalanche" });
    expect(fold(suffixed, silent)).toMatchObject({ entityLabel: exact.label, chain: "avalanche" });
    expect(fold(silent).chain).toBeNull();
  });
});
