import { describe, expect, it } from "vitest";
import type { ToolCallRecord } from "./api";
import { extractOtherLinks, toolClassesUsed } from "./otherSources";

const call = (name: string, ok = true): ToolCallRecord => ({ name, args: {}, ok, bytes: 10 });

describe("extractOtherLinks", () => {
  it("lists chain and outside links once each, in order, and skips Atlas citations and unknown hosts", () => {
    const text = [
      "The limit is [50M](/atlas/" + "a".repeat(36) + ") and it holds [45M](https://etherscan.io/address/0xabc).",
      "See [the tx](https://etherscan.io/tx/0x9f) and again [that tx](https://etherscan.io/tx/0x9f),",
      "[Soter workbook](https://github.com/soterlabs/settlement-reports/x) and [a blog](https://example.com/b).",
    ].join("\n");
    expect(extractOtherLinks(text).map((l) => [l.text, l.class])).toEqual([
      ["45M", "onchain"],
      ["the tx", "onchain"],
      ["Soter workbook", "external"],
    ]);
  });
});

describe("toolClassesUsed", () => {
  it("unions the classes of successful calls, in registry order with the tools behind each", () => {
    const used = toolClassesUsed([call("atlas_entity"), call("redline_onchain"), call("atlas_get"), call("atlas_traverse"), call("external_msc", false)]);
    expect(used).toEqual([
      { class: "onchain", tools: ["redline_onchain"] },
      { class: "derived", tools: ["atlas_entity", "atlas_traverse"] },
    ]);
  });

  it("is empty for an answer that used only Atlas text, and puts a preview last", () => {
    expect(toolClassesUsed([call("atlas_get"), call("atlas_search")])).toEqual([]);
    expect(toolClassesUsed([call("atlas_preview_get"), call("atlas_entity")]).map((u) => u.class)).toEqual(["derived", "preview"]);
    expect(toolClassesUsed(undefined)).toEqual([]);
  });
});
