import { describe, expect, it } from "vitest";
import { classifyLink } from "./linkClass";

describe("classifyLink", () => {
  it("calls a block-explorer page on-chain, whichever chain's explorer it is", () => {
    expect(classifyLink("https://etherscan.io/tx/0x9f21")).toBe("onchain");
    expect(classifyLink("https://basescan.org/address/0xabc")).toBe("onchain");
  });

  it("calls the vote portal, the forum, GitHub and Soter's workbooks someone else's record", () => {
    expect(classifyLink("https://vote.sky.money/executive/abc")).toBe("external");
    expect(classifyLink("https://forum.sky.money/t/some-post/123")).toBe("external");
    expect(classifyLink("https://github.com/soterlabs/settlement-reports/blob/main/x.xlsx")).toBe("external");
    expect(classifyLink("https://github.com/sky-ecosystem/next-gen-atlas/pull/12")).toBe("external");
  });

  it("calls a preview path a preview, not a source class", () => {
    expect(classifyLink(`/preview/${"a".repeat(40)}/atlas?id=${"b".repeat(36)}`)).toBe("preview");
  });

  it("leaves Atlas citations and hosts it does not know unclassified", () => {
    expect(classifyLink(`/atlas/${"b".repeat(36)}`)).toBeNull();
    expect(classifyLink("https://example.com/page")).toBeNull();
    expect(classifyLink("not a url")).toBeNull();
    expect(classifyLink(undefined)).toBeNull();
  });
});
