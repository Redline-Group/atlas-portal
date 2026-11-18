import { describe, it, expect } from "vitest";
import { quoteInDoc } from "./mistakeQuote";
import type { AtlasNode } from "../types";

const doc = (over: Partial<AtlasNode>): AtlasNode =>
  ({
    id: "u",
    doc_no: "A.6.1.1.4.2.5.2.2.3.3",
    title: "Data Repository",
    type: "Core",
    depth: 6,
    parentId: null,
    content: "The documents herein contain data relevant to the\nMorpho Instance.",
    order: 0,
    addressRefs: [],
    ...over,
  }) as AtlasNode;

describe("quoteInDoc", () => {
  it("finds body text, ignoring how whitespace was quoted", () => {
    expect(quoteInDoc("contain data relevant to the Morpho Instance.", "A.1", doc({}))).toBe(true);
  });

  it("misses a quote the atlas has since rewritten", () => {
    expect(quoteInDoc("A.6.1.1.4.2.5.2.2.3.3 - Date Repository [Core]", "A.6.1.1.4.2.5.2.2.3.3", doc({}))).toBe(false);
  });

  it("matches a quoted heading line under the sweep-time or current doc_no", () => {
    const d = doc({ doc_no: "A.9.9" });
    expect(quoteInDoc("A.6.1.1.4.2.5.2.2.3.3 - Data Repository [Core]", "A.6.1.1.4.2.5.2.2.3.3", d)).toBe(true);
    expect(quoteInDoc("A.9.9 - Data Repository [Core]", "A.1", d)).toBe(true);
  });

  it("matches a raw markdown heading with its UUID comment, running into the body", () => {
    const q = "###### A.1 - Data Repository [Core] <!-- UUID: u --> The documents herein";
    expect(quoteInDoc(q, "A.1", doc({}))).toBe(true);
  });

  it("needs every fragment of an elided quote", () => {
    expect(quoteInDoc("The documents herein ... Morpho Instance", "A.1", doc({}))).toBe(true);
    expect(quoteInDoc("The documents herein [...] Curve Instance", "A.1", doc({}))).toBe(false);
  });
});

describe("quoteInDoc typography", () => {
  it("treats curly and straight quotes alike and ignores a fragment's trailing punctuation", () => {
    const d = doc({ content: "the surplus held in Keel’s SubProxy" });
    expect(quoteInDoc("the surplus held in Keel's SubProxy.", "A.1", d)).toBe(true);
    expect(quoteInDoc("the surplus held in Grove's SubProxy.", "A.1", d)).toBe(false);
  });
});
