// The tiers: each runs only for the keys the ones before it left; every tier
// pairs an address with itself; spells' stated pairs are kept only when well
// formed; the last tier takes one argument from each list, in either order.
import { describe, expect, it } from "bun:test";
import { encodeAbiParameters, keccak256, toHex } from "viem";
import { monolithicShapes } from "./key-derive.ts";
import type { KeyContext } from "./key-context.ts";
import { deriveTiered, nearTier, outwardTier, primeTier } from "./key-tiers.ts";

const [A, B, C, D] = ["0x" + "a".repeat(40), "0x" + "b".repeat(40), "0x" + "c".repeat(40), "0x" + "d".repeat(40)];
const transfer = (x: string, y: string) => keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "address" }, { type: "address" }], [keccak256(toHex("LIMIT_ASSET_TRANSFER")), x as `0x${string}`, y as `0x${string}`]));
const ctx: KeyContext = { instances: [[A]], prime: [A, B], own: [C], stated: [`${B},${C}`, "not a pair", `${A},0x12`] };

describe("tier sources", () => {
  it("pairs within each instance and the deployment's own addresses, each with itself, plus well-formed stated pairs", () => {
    expect(nearTier(ctx).pairs).toEqual([[A, A], [C, C], [B, C]]);
  });
  it("pairs every address of the prime and the deployment together, then crosses them with every candidate", () => {
    expect(primeTier(ctx).pairs).toHaveLength(9);
    expect(outwardTier(ctx, [D, B.toUpperCase().replace("0X", "0x")]).cross).toEqual([[A, B, A, C], [D]]);
  });
});

describe("deriveTiered", () => {
  const shapes = ["LIMIT_ASSET_TRANSFER"].flatMap(monolithicShapes);
  it("names a key in the first tier that holds its pair, and builds no later tier once every key is named", () => {
    let built = 0;
    const tier = (pairs: string[][]) => () => (built++, { pairs });
    const found = deriveTiered(shapes, { addresses: [], words: [] }, [tier([[A, A]]), tier([[B, C]]), tier([[D, D]])], [transfer(A, A), transfer(B, C)]);
    expect([found.get(transfer(A, A))?.args, found.get(transfer(B, C))?.args, built]).toEqual([[A, A], [B, C], 2]);
  });
  it("tries the crossed lists only for an asset transfer, not for a Uniswap V3 pool", () => {
    const uni = keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "address" }, { type: "address" }], [keccak256(toHex("LIMIT_UNISWAP_V3_SWAP")), C as `0x${string}`, D as `0x${string}`]));
    const found = deriveTiered(["LIMIT_UNISWAP_V3_SWAP"].flatMap(monolithicShapes), { addresses: [], words: [] }, [() => outwardTier(ctx, [D])], [uni]);
    expect(found.size).toBe(0);
  });
  it("finds a pair with one argument from each list in either order, and nothing when no key is asked", () => {
    const found = deriveTiered(shapes, { addresses: [], words: [] }, [() => outwardTier(ctx, [D])], [transfer(D, B), transfer(C, D)]);
    expect([found.get(transfer(D, B))?.args, found.get(transfer(C, D))?.args]).toEqual([[D, B], [C, D]]);
    expect(deriveTiered(shapes, { addresses: [], words: [] }, [() => { throw new Error("built"); }], []).size).toBe(0);
  });
});
