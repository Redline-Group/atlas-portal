import { describe, it, expect } from "vitest";
import type { AddressBalances } from "@/lib/balances";
import type { MultisigFact } from "@/lib/addressGraphFacts";
import { makeAddressInfo } from "../test/fixtures";
import { resolveSafes } from "./addressSafe";

const ADDR = "0x492aae70e59551768baf3c7159d3f951b6ed76fe";
const O1 = "0xaaaa000000000000000000000000000000000001";
const O2 = "0xbbbb000000000000000000000000000000000002";
const O3 = "0xcccc000000000000000000000000000000000003";

const read = (chain: string, safe: AddressBalances["safe"]): AddressBalances => ({ chain, checkedAt: null, balances: {}, hasCode: null, safe });
const atlas = (chain: string, required: number, total: number): MultisigFact => ({ name: "Spark Operator Multisig", chain, threshold: { required, total }, docId: "root" });

function setup(chains: string[], reads: Record<string, AddressBalances>) {
  return { map: { [ADDR]: makeAddressInfo({ chain: chains[0], chains }) }, reads };
}

describe("resolveSafes", () => {
  it("shows the chain's setup and no atlas line when the atlas agrees", () => {
    const { map, reads } = setup(["ethereum"], { [`${ADDR}|ethereum`]: read("ethereum", { threshold: 2, owners: [O1, O2, O3] }) });
    expect(resolveSafes(ADDR, map, reads, [atlas("ethereum", 2, 3)])).toEqual([
      { threshold: 2, owners: [O1, O2, O3], chains: ["ethereum"], atlas: null, elsewhere: false },
    ]);
  });

  it("adds the atlas's threshold when it disagrees with the chain", () => {
    const { map, reads } = setup(["ethereum"], { [`${ADDR}|ethereum`]: read("ethereum", { threshold: 2, owners: [O1, O2] }) });
    const [safe] = resolveSafes(ADDR, map, reads, [atlas("ethereum", 2, 3)]);
    expect(safe.atlas).toEqual({ name: "Spark Operator Multisig", required: 2, total: 3, docId: "root" });
  });

  it("merges chains with the same setup and keeps a differing chain apart", () => {
    const same = { threshold: 2, owners: [O1, O2, O3] };
    const { map, reads } = setup(["arbitrum", "base", "optimism"], {
      [`${ADDR}|arbitrum`]: read("arbitrum", same),
      [`${ADDR}|base`]: read("base", same),
      [`${ADDR}|optimism`]: read("optimism", { threshold: 1, owners: [O1] }),
    });
    expect(resolveSafes(ADDR, map, reads, []).map((s) => s.chains)).toEqual([["arbitrum", "base"], ["optimism"]]);
  });

  it("merges chains whose Safe lists the same owners in a different order", () => {
    const { map, reads } = setup(["ethereum", "avalanche"], {
      [`${ADDR}|ethereum`]: read("ethereum", { threshold: 2, owners: [O1, O2, O3] }),
      [`${ADDR}|avalanche`]: read("avalanche", { threshold: 2, owners: [O2, O1, O3] }),
    });
    expect(resolveSafes(ADDR, map, reads, []).map((s) => s.chains)).toEqual([["ethereum", "avalanche"]]);
  });

  it("shows nothing without an on-chain read, whatever the atlas states", () => {
    const { map } = setup(["ethereum"], {});
    expect(resolveSafes(ADDR, map, {}, [atlas("ethereum", 2, 3)])).toEqual([]);
  });

  it("falls back to the address read on other chains when none of the atlas's chains was read", () => {
    // A preview moves the Spark Operator Multisig's address doc to Ethereum,
    // while the sweep read the same Safe on Arbitrum and Base.
    const same = { threshold: 2, owners: [O1, O2, O3] };
    const { map, reads } = setup(["ethereum"], {
      [`${ADDR}|base`]: read("base", same),
      [`${ADDR}|arbitrum`]: read("arbitrum", same),
      [`${O1}|ethereum`]: read("ethereum", { threshold: 1, owners: [O2] }),
    });
    expect(resolveSafes(ADDR, map, reads, [])).toEqual([{ ...same, chains: ["arbitrum", "base"], atlas: null, elsewhere: true }]);
  });

  it("compares a reading from elsewhere only with what the atlas states for that chain", () => {
    const { map, reads } = setup(["ethereum"], { [`${ADDR}|arbitrum`]: read("arbitrum", { threshold: 1, owners: [O1] }) });
    expect(resolveSafes(ADDR, map, reads, [atlas("ethereum", 2, 3)])[0].atlas).toBeNull();
  });

  it("does not fall back when an atlas chain was read and holds no Safe", () => {
    const { map, reads } = setup(["ethereum"], {
      [`${ADDR}|ethereum`]: read("ethereum", null),
      [`${ADDR}|arbitrum`]: read("arbitrum", { threshold: 2, owners: [O1, O2, O3] }),
    });
    expect(resolveSafes(ADDR, map, reads, [])).toEqual([]);
  });

  it("does not fall back for an address the map does not hold yet", () => {
    const reads = { [`${ADDR}|arbitrum`]: read("arbitrum", { threshold: 2, owners: [O1, O2, O3] }) };
    expect(resolveSafes(ADDR, {}, reads, [])).toEqual([]);
  });
});
