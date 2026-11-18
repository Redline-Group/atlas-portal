import { test, expect } from "bun:test";
import { renderPatch } from "./bundle-read.ts";
import { contentDiff } from "./patch-diff.ts";

test("an in-line edit renders as the whole old line then the whole new line", () => {
  const lines = contentDiff("- splitter.hop: 2,504 seconds", "- splitter.hop: 2,693 seconds");
  expect(renderPatch(lines, 10)).toEqual(["- - splitter.hop: 2,504 seconds", "+ - splitter.hop: 2,693 seconds"]);
});

test("added and removed lines keep their sign; the cap counts rendered lines", () => {
  const lines = contentDiff("a\nb\nc", "a\nB\nc\nd");
  const out = renderPatch(lines, 1);
  expect(out[0]).toMatch(/^[-+] /);
  expect(out.at(-1)).toMatch(/more lines\)$/);
});

test("unchanged lines are left out, with … between separate changes", () => {
  const lines = contentDiff("a\nb\nc\nd\ne", "A\nb\nc\nd\nE");
  expect(renderPatch(lines, 10)).toEqual(["- a", "+ A", "…", "- e", "+ E"]);
});

test("the overflow count names only the changed lines left out", () => {
  const lines = contentDiff("a\nx\nb\ny\nc", "a\nX\nb\nY\nc");
  expect(renderPatch(lines, 2)).toEqual(["- x", "+ X", "… (2 more lines)"]);
});
