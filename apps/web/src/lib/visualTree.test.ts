import { describe, expect, it } from "vitest";
import type { FlatEntry } from "@/lib/atlasHelpers";
import { makeFlatEntry, makeNode } from "../test/fixtures";
import {
  ancestorsOfMatches,
  buildVisualTree,
  descendantRun,
  entryDepth,
  hiddenByCollapse,
  visualAncestorIds,
  visualSubtreeIds,
} from "./visualTree";

// root(1) > a(2) > a1(3), a2(3); root > b(2)
const rows: FlatEntry[] = (
  [["root", 1], ["a", 2], ["a1", 3], ["a2", 3], ["b", 2]] as const
).map(([id, depth]) => makeFlatEntry({ node: makeNode({ id }), depth }));

describe("visualTree", () => {
  it("descendantRun spans the deeper run after a row", () => {
    expect(descendantRun(rows, 1, entryDepth)).toEqual({ start: 2, end: 3 });
    expect(descendantRun(rows, 4, entryDepth)).toBeNull();
    expect(descendantRun(rows, -1, entryDepth)).toBeNull();
  });

  it("visualSubtreeIds and visualAncestorIds walk down and up", () => {
    expect(visualSubtreeIds(rows, "a")).toEqual(["a1", "a2"]);
    expect(visualSubtreeIds(rows, "missing")).toEqual([]);
    expect(visualAncestorIds(rows, "a2")).toEqual(["a", "root"]);
    expect(visualAncestorIds(rows, "missing")).toBeNull();
  });

  it("buildVisualTree records span sizes, children and parents", () => {
    const tree = buildVisualTree(rows);
    expect(tree.spanCount.get("root")).toBe(4);
    expect(tree.spanCount.get("a")).toBe(2);
    expect(tree.spanCount.get("b")).toBe(0);
    expect(tree.children.get("root")).toEqual(["a", "b"]);
    expect(tree.parent.get("a2")).toBe("a");
    expect(tree.children.has("b")).toBe(false);
  });

  it("hiddenByCollapse hides everything under a collapsed row", () => {
    expect([...hiddenByCollapse(rows, (id) => id === "a")]).toEqual(["a1", "a2"]);
    expect([...hiddenByCollapse(rows, (id) => id === "root")]).toEqual(["a", "a1", "a2", "b"]);
  });

  it("ancestorsOfMatches collects every visual ancestor of a match", () => {
    const { parent } = buildVisualTree(rows);
    expect([...ancestorsOfMatches(rows, parent, new Set(["a2"]))].sort()).toEqual(["a", "root"]);
    expect(ancestorsOfMatches(rows, parent, null).size).toBe(0);
  });
});
