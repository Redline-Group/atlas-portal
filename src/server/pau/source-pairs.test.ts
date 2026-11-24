// Address pairs one argument list passes together: named constants resolve by
// owner (read past comments) or unique bare name, a literal counts, a name two
// owners define differently does not resolve bare, a long registry-like list and
// a body are not one call, and escaped multi-file sources read the same.
import { describe, expect, it } from "bun:test";
import { argumentPairs } from "./source-pairs.ts";

const [USDC, ARB_USDC, DEST, SUSDS] = ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", "0x" + "d".repeat(40), "0x" + "5".repeat(40)];
const lc = (a: string) => a.toLowerCase();
const spell = [
  "library Ethereum {",
  `  address internal constant USDC = ${USDC};`,
  `  address internal constant SUSDS = ${SUSDS};`,
  "}",
  "library Arbitrum {",
  `  address internal constant USDC = ${ARB_USDC};`,
  "}",
  "contract Payload {",
  `  address internal constant DESTINATION = ${DEST};`,
  "  function execute() external {",
  "    bytes32 key = RateLimitHelpers.makeAssetDestinationKey(",
  "      controller.LIMIT_ASSET_TRANSFER(),",
  "      Ethereum.USDC,",
  "      DESTINATION",
  "    );",
  "    bytes32 other = RateLimitHelpers.makeAssetKey(controller.LIMIT_4626_DEPOSIT(), USDC);",
  "  }",
  "}",
].join("\n");

describe("argumentPairs", () => {
  it("pairs the addresses one call passes, resolving owner-qualified and unique bare constants", () => {
    expect(argumentPairs(spell)).toEqual([`${lc(DEST)},${lc(USDC)}`, `${lc(USDC)},${lc(DEST)}`].sort());
  });
  it("reads owners past comments, and falls back to the one constant of a name when the owner is an import alias", () => {
    const src = ["library Base {", "  /// @notice the contract addresses on Base", `  address internal constant USDC = ${USDC};`, `  address internal constant DEST = ${DEST};`, "}", "contract P { function f() external { g(B.USDC, Base.DEST); } }"].join("\n");
    expect(argumentPairs(src)).toEqual([`${lc(DEST)},${lc(USDC)}`, `${lc(USDC)},${lc(DEST)}`].sort());
  });
  it("keeps a call that shares its line with a URL, and still drops a call inside a comment", () => {
    const src = `string constant U = "https://forum.sky.money"; f(${USDC}, ${DEST}); // g(${DEST}, ${SUSDS})`;
    expect(argumentPairs(src)).toEqual([`${lc(DEST)},${lc(USDC)}`, `${lc(USDC)},${lc(DEST)}`].sort());
  });
  it("pairs literal addresses too", () => {
    expect(argumentPairs(`f(${USDC}, ${SUSDS})`)).toEqual([`${lc(USDC)},${lc(SUSDS)}`, `${lc(SUSDS)},${lc(USDC)}`].sort());
  });
  it("leaves out a list naming more addresses than one call would", () => {
    const many = Array.from({ length: 9 }, (_, i) => "0x" + String(i + 1).repeat(40)).join(", ");
    expect(argumentPairs(`register(${many})`)).toEqual([]);
  });
  it("reads a multi-file source escaped inside a JSON string the same way", () => {
    const escaped = JSON.stringify({ sources: { "a.sol": { content: spell } } });
    expect(argumentPairs(`{${escaped}}`)).toEqual(argumentPairs(spell));
  });
});
