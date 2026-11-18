import { describe, expect, it } from "vitest";
import { docPatch, headingDiff, headingLine, previewPatch, type BeforeEntry, type PatchDoc, type PatchSource } from "./previewPatch";

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

describe("headingDiff", () => {
  it("marks only the fields that changed: the doc number's last segment and the title's new words", () => {
    const id = "09ddd2c5-3768-4538-b979-629e1b369299";
    const a = { id, doc_no: "A.2.2.9.2.2.3.2.4.2.1", title: "Primitive Hub Document Update", type: "Core" };
    const b = { id, doc_no: "A.2.2.9.2.2.3.2.4.2.2", title: "Primitive Hub Document/In Progress Invocations Directory/Instance Name Creation", type: "Core" };
    const [, segs] = headingDiff(a, b) as ["~", [string, string][]];
    const changed = segs.filter(([op]) => op !== "=").map(([op, t]) => op + t);
    expect(changed).toEqual(["-1", "+2", "+/In", "-Update", "+Progress Invocations Directory/Instance Name Creation"]);
    // Type and UUID are unchanged, so they sit in plain text.
    expect(segs.at(-1)).toEqual(["=", ` [Core] <!-- UUID: ${id} -->`]);
  });

  it("marks a changed type or UUID whole, never piecewise", () => {
    const [, segs] = headingDiff(doc(), doc({ id: OTHER, type: "Section" })) as ["~", [string, string][]];
    const changed = segs.filter(([op]) => op !== "=").map(([op, t]) => op + t);
    expect(changed).toEqual(["- [Core]", "+ [Section]", `-${UUID}`, `+${OTHER}`]);
  });
});

describe("previewPatch", () => {
  const before: Record<string, BeforeEntry> = { [UUID]: { doc_no: "A.1.2", title: "Rate Limits", type: "Core" } };
  /** A source over one preview document (and nothing removed) unless a test says otherwise. */
  const source = (over: Partial<PatchSource> & { the?: PatchDoc } = {}): PatchSource => ({
    formerUuid: {},
    identitySwap: {},
    before,
    doc: (id) => (id === UUID ? (over.the ?? doc()) : undefined),
    removed: () => undefined,
    ...over,
  });

  it("a changed doc whose body did not change reads its old body from the new side", () => {
    const out = previewPatch(UUID, "changed", source({ the: doc({ title: "Rates" }) }));
    expect(out[0][0]).toBe("~");
    expect(out.slice(1)).toEqual([["=", "one"], ["=", "two"]]);
  });

  it("a changed doc with an old body diffs against it", () => {
    const out = previewPatch(UUID, "changed", source({ before: { [UUID]: { ...before[UUID], content: "one\ntwo three" } } }));
    expect(out.map((l) => l[0])).toEqual(["=", "=", "~"]);
  });

  it("a changed doc with no old side has no redline, never an all-added one", () => {
    expect(previewPatch(UUID, "changed", source({ before: {} }))).toEqual([]);
  });

  it("an identity swap whose old content was found elsewhere shows only the new document", () => {
    const out = previewPatch(UUID, "changed", source({ identitySwap: { [UUID]: { movedTo: { id: OTHER } } } }));
    expect(out.every((l) => l[0] === "+")).toBe(true);
  });

  it("content that moved in from another UUID diffs against that UUID's old text", () => {
    const moved: Record<string, BeforeEntry> = { [OTHER]: { doc_no: "A.1.2", title: "Rate Limits", type: "Core", content: "one\ntwo" } };
    const out = previewPatch(UUID, "added", source({ before: moved, formerUuid: { [UUID]: { previousId: OTHER } }, the: doc({ content: "one\ntwo\nthree" }) }));
    expect(out.slice(1)).toEqual([["=", "one"], ["=", "two"], ["+", "three"]]);
  });

  it("a removed doc is all removals", () => {
    const removed = { ...doc(), parentId: null, after: null, depth: 1 };
    expect(previewPatch(UUID, "removed", source({ removed: () => removed })).every((l) => l[0] === "-")).toBe(true);
  });
});

describe("headingDiff: the doc number as one run", () => {
  const changedOf = (a: string, b: string) => {
    const [, segs] = headingDiff(doc({ doc_no: a }), doc({ doc_no: b })) as ["~", [string, string][]];
    return segs.filter(([op]) => op !== "=").map(([op, t]) => op + t);
  };

  it("marks a shifted level as one changed run, not scattered digits", () => {
    expect(changedOf("A.1.2.1", "A.1.1.2")).toEqual(["-2.1", "+1.2"]);
  });

  it("keeps the separator with a segment that is added or dropped", () => {
    expect(changedOf("A.1", "A.1.2")).toEqual(["+.2"]);
    expect(changedOf("A.1.2", "A.1")).toEqual(["-.2"]);
  });
});
