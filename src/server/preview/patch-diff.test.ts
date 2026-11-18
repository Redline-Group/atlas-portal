// Run via `bun test src/server`. Pure unit tests — no DB, no network.
import { test, expect } from "bun:test";
import { contentDiff, docPatch, headingLine } from "./patch-diff";

const UUID = "11111111-2222-3333-4444-555555555555";
const doc = (over: Partial<Parameters<typeof docPatch>[1]> = {}) => ({
  id: UUID,
  doc_no: "A.1.2",
  title: "Rate Limits",
  type: "Core",
  content: "one\ntwo",
  ...over,
});

test("contentDiff: identical content → []", () => {
  expect(contentDiff("a\nb\nc", "a\nb\nc")).toEqual([]);
});

test("contentDiff: keeps every unchanged line, with no context trimming or … gaps", () => {
  const prev = ["one", "two", "three", "four", "five", "six", "the cat sat", "eight"].join("\n");
  const curr = ["one", "two", "three", "four", "five", "six", "the dog sat", "eight"].join("\n");
  const out = contentDiff(prev, curr);
  expect(out).toHaveLength(8);
  expect(out[0]).toEqual(["=", "one"]);
  expect(out.some((l) => l[0] === "…")).toBe(false);
  expect(out[6]).toEqual(["~", [["=", "the "], ["-", "cat"], ["+", "dog"], ["=", " sat"]]]);
});

test("contentDiff: keeps every line of a long diff, with no trailing …", () => {
  const curr = Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n");
  const out = contentDiff("", curr);
  expect(out.length).toBe(40);
  expect(out.every(([op]) => op === "+")).toBe(true);
  expect(out[39]).toEqual(["+", "line 39"]);
});

test("headingLine: doc number, title, type and UUID, without a # level", () => {
  expect(headingLine(doc())).toBe(`A.1.2 - Rate Limits [Core] <!-- UUID: ${UUID} -->`);
  expect(headingLine(doc({ type: undefined }))).toBe(`A.1.2 - Rate Limits <!-- UUID: ${UUID} -->`);
});

test("docPatch: a body edit carries the unchanged heading and the whole body", () => {
  const out = docPatch(doc(), doc({ content: "one\nTWO" }));
  expect(out[0]).toEqual(["=", headingLine(doc())]);
  expect(out[1]).toEqual(["=", "one"]);
  expect(out).toHaveLength(4);
});

test("docPatch: a renumber alone is an edited heading over an unchanged body", () => {
  const out = docPatch(doc(), doc({ doc_no: "A.1.3" }));
  expect(out[0][0]).toBe("~");
  expect(out.slice(1)).toEqual([["=", "one"], ["=", "two"]]);
});

test("docPatch: a new document is all additions, heading first", () => {
  expect(docPatch(undefined, doc())).toEqual([["+", headingLine(doc())], ["+", "one"], ["+", "two"]]);
});

test("docPatch: nothing differs → []", () => {
  expect(docPatch(doc(), doc())).toEqual([]);
});
