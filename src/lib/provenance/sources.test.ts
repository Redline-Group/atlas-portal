import { describe, expect, it } from "vitest";
import { csvPreamble } from "./csvPreamble";
import { SOURCE_CLASSES, SOURCE_CLASS_IDS, normalizeSources, sourceAnchor, sourceSearchText } from "./sources";

describe("source classes", () => {
  it("declares one class per id, each with its own glyph and word", () => {
    expect(Object.keys(SOURCE_CLASSES).sort()).toEqual([...SOURCE_CLASS_IDS].sort());
    expect(new Set(SOURCE_CLASS_IDS.map((i) => SOURCE_CLASSES[i].glyph)).size).toBe(SOURCE_CLASS_IDS.length);
    expect(new Set(SOURCE_CLASS_IDS.map((i) => SOURCE_CLASSES[i].word)).size).toBe(SOURCE_CLASS_IDS.length);
  });

  it("gives each class a distinct /provenance anchor", () => {
    expect(new Set(SOURCE_CLASS_IDS.map(sourceAnchor)).size).toBe(SOURCE_CLASS_IDS.length);
  });

  it("normalizes to registry order without duplicates", () => {
    expect(normalizeSources(["ai", "onchain", "ai"])).toEqual(["onchain", "ai"]);
  });

  it("searches by the words a reader sees on the chips", () => {
    expect(sourceSearchText(["ai", "onchain"])).toBe("on-chain AI");
  });
});

describe("csvPreamble", () => {
  const at = new Date("2026-11-16T13:05:59Z");

  it("comments every line and lists each declared class with its caveat", () => {
    const text = csvPreamble({ title: "Stale Dates", sources: ["ai", "derived"], sha: "abcdef0123456789", exportedAt: at });
    const lines = text.trimEnd().split("\n");
    expect(lines.every((l) => l.startsWith("#"))).toBe(true);
    expect(lines[0]).toBe("# Redline Portal: Stale Dates");
    expect(lines[1]).toBe("# Atlas commit: abcdef01. Exported 2026-11-16T13:05Z.");
    expect(text).toContain("∴ derived");
    expect(text).toContain("✳ AI");
    expect(text.endsWith("\n")).toBe(true);
  });

  it("says so when a report is Atlas text only, and when the commit is unknown", () => {
    const text = csvPreamble({ title: "X", sources: [], sha: null, exportedAt: at });
    expect(text).toContain("Atlas text only");
    expect(text).toContain("Atlas commit: unknown");
  });
});
