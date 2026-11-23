// makeEntry keeps every file of a verified contract, whichever explorer answered.
import { describe, expect, it } from "vitest";
import { makeEntry } from "../scripts/lib/explorer-source.ts";
import { parseFacet } from "../src/server/pau/facet-source.ts";

const HELPERS = `function makeAddressKey(bytes32 key, address a) pure returns (bytes32) { return keccak256(abi.encode(key, a)); }`;
const FACET = `contract NFATPrimeFacet {
    bytes32 internal constant _LIMIT_COLLECT = keccak256("LIMIT_NFAT_PRIME_COLLECT");
    function getCollectRateLimitKey(address facility) public pure override returns (bytes32) { return makeAddressKey(_LIMIT_COLLECT, facility); }
}`;

describe("makeEntry", () => {
  it("folds Blockscout's main file and AdditionalSources into one standard-JSON input", () => {
    const entry = makeEntry(1, "0xabc", {
      ContractName: "NFATPrimeFacet", FileName: "src/facets/nfat-prime/NFATPrimeFacet.sol", SourceCode: FACET,
      AdditionalSources: [{ Filename: "src/libraries/RateLimitHelpers.sol", SourceCode: HELPERS }],
    });
    expect(Object.keys(JSON.parse(entry.sourceCode).sources)).toEqual(["src/facets/nfat-prime/NFATPrimeFacet.sol", "src/libraries/RateLimitHelpers.sol"]);
    expect(parseFacet(entry)).toEqual([{ facet: "NFATPrimeFacet", getter: "getCollectRateLimitKey", constant: "LIMIT_NFAT_PRIME_COLLECT", types: ["address"], roles: ["facility"] }]);
  });
  it("leaves a single-file answer, and Etherscan's own standard JSON, as written", () => {
    expect(makeEntry(1, "0xabc", { ContractName: "A", SourceCode: "contract A {}" }).sourceCode).toBe("contract A {}");
    expect(makeEntry(1, "0xabc", { ContractName: "A", SourceCode: '{{"sources":{}}}' }).sourceCode).toBe('{{"sources":{}}}');
  });
});
