import { describe, expect, it } from "vitest";
import { docPatch, headingLine, previewPatch, type BeforeEntry, type PatchDoc } from "./previewPatch";

const UUID = "11111111-2222-3333-4444-555555555555";
const OTHER = "99999999-2222-3333-4444-555555555555";
const doc = (over: Partial<PatchDoc> = {}): PatchDoc => ({
  id: UUID,
  doc_no: "A.1.2",
  title: "Rate Limits",
  type: "Core",
  content: "one\ntwo",
  ...over,
});

describe("headingLine", () => {
  it("is the doc number, title, type and UUID, without a # level", () => {
    expect(headingLine(doc())).toBe(`A.1.2 - Rate Limits [Core] <!-- UUID: ${UUID} -->`);
    expect(headingLine(doc({ type: undefined }))).toBe(`A.1.2 - Rate Limits <!-- UUID: ${UUID} -->`);
  });
});

describe("docPatch", () => {
  it("keeps every unchanged line, with no context trimming or … gaps", () => {
    const body = ["one", "two", "three", "four", "five", "six", "the cat sat", "eight"];
    const out = docPatch(doc({ content: body.join("\n") }), doc({ content: [...body.slice(0, 6), "the dog sat", "eight"].join("\n") }));
    expect(out).toHaveLength(9);
    expect(out[0]).toEqual(["=", headingLine(doc())]);
    expect(out.some((l) => l[0] === "…")).toBe(false);
    expect(out[7]).toEqual(["~", [["=", "the "], ["-", "cat"], ["+", "dog"], ["=", " sat"]]]);
  });

  it("never caps a long document", () => {
    const content = Array.from({ length: 60 }, (_, i) => `line ${i}`).join("\n");
    expect(docPatch(undefined, doc({ content }))).toHaveLength(61);
  });

  it("a renumbering alone is an edited heading over an unchanged body", () => {
    const out = docPatch(doc(), doc({ doc_no: "A.1.3" }));
    expect(out[0][0]).toBe("~");
    expect(out.slice(1)).toEqual([["=", "one"], ["=", "two"]]);
  });

  it("a missing side is all additions or all removals, heading first", () => {
    expect(docPatch(undefined, doc())).toEqual([["+", headingLine(doc())], ["+", "one"], ["+", "two"]]);
    expect(docPatch(doc(), undefined)).toEqual([["-", headingLine(doc())], ["-", "one"], ["-", "two"]]);
  });

  it("is empty when nothing differs", () => {
    expect(docPatch(doc(), doc())).toEqual([]);
  });
});

describe("previewPatch", () => {
  const before: Record<string, BeforeEntry> = { [UUID]: { doc_no: "A.1.2", title: "Rate Limits", type: "Core" } };

  it("a changed doc whose body did not change reads its old body from the new side", () => {
    const out = previewPatch({ id: UUID, kind: "changed", doc: doc({ title: "Rates" }), before });
    expect(out[0][0]).toBe("~");
    expect(out.slice(1)).toEqual([["=", "one"], ["=", "two"]]);
  });

  it("a changed doc with an old body diffs against it", () => {
    const out = previewPatch({ id: UUID, kind: "changed", doc: doc(), before: { [UUID]: { ...before[UUID], content: "one\ntwo three" } } });
    expect(out.map((l) => l[0])).toEqual(["=", "=", "~"]);
  });

  it("a changed doc with no old side has no redline, never an all-added one", () => {
    expect(previewPatch({ id: UUID, kind: "changed", doc: doc(), before: {} })).toEqual([]);
  });

  it("a corroborated identity swap shows only the new document", () => {
    const out = previewPatch({ id: UUID, kind: "changed", doc: doc(), before, corroboratedSwap: true });
    expect(out.every((l) => l[0] === "+")).toBe(true);
  });

  it("content that moved in from another UUID diffs against that UUID's old text", () => {
    const moved: Record<string, BeforeEntry> = { [OTHER]: { doc_no: "A.1.2", title: "Rate Limits", type: "Core", content: "one\ntwo" } };
    const out = previewPatch({ id: UUID, kind: "added", doc: doc({ content: "one\ntwo\nthree" }), before: moved, previousId: OTHER });
    expect(out.slice(1)).toEqual([["=", "one"], ["=", "two"], ["+", "three"]]);
  });

  it("a removed doc is all removals", () => {
    const removed = { ...doc(), parentId: null, after: null, depth: 1 };
    expect(previewPatch({ id: UUID, kind: "removed", before: {}, removed }).every((l) => l[0] === "-")).toBe(true);
  });
});
