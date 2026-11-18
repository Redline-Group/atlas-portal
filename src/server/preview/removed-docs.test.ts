// Where removed.json places each removed document: against the tree the
// reader renders (docTree, read from doc numbers), never the stored parentId.
// Run via `bun test`.
import { describe, expect, test } from "bun:test";
import { removedDocs } from "./removed-docs.ts";
import type { Snapshot, SnapshotDoc } from "./snapshot.ts";

const node = (id: string, docNo: string, order: number, parentId: string | null = null): SnapshotDoc => ({
  id,
  doc_no: docNo,
  title: `T${id}`,
  content: `body ${id}`,
  parentId,
  order,
  depth: docNo.split(".").length - 1,
});
const snap = (...docs: SnapshotDoc[]): Snapshot => new Map(docs.map((d) => [d.id, d]));

describe("removedDocs", () => {
  const base = snap(
    node("p", "A.1.1", 0),
    node("a", "A.1.1.1", 1, "p"),
    node("b", "A.1.1.2", 2, "p"),
    node("c", "A.1.1.3", 3, "p"),
    node("d", "A.1.1.4", 4, "p"),
  );

  test("each follows the nearest earlier sibling the head keeps under the same parent", () => {
    const head = snap(node("p", "A.1.1", 0), node("a", "A.1.1.1", 1, "p"), node("d", "A.1.1.2", 2, "p"));
    const out = removedDocs(["c", "b"], base, head);
    expect(out.map((d) => [d.id, d.after])).toEqual([["b", "a"], ["c", "b"]]);
    expect(out[0]).toMatchObject({ doc_no: "A.1.1.2", content: "body b", parentId: "p" });
  });

  test("the first child follows nothing", () => {
    const head = snap(node("p", "A.1.1", 0), node("b", "A.1.1.1", 1, "p"));
    expect(removedDocs(["a"], base, head)[0].after).toBeNull();
  });

  test("a sibling the head moved under another parent is not an anchor", () => {
    const head = snap(node("p", "A.1.1", 0), node("q", "A.1.2", 1), node("a", "A.1.2.1", 2, "q"), node("c", "A.1.1.2", 3, "p"));
    expect(removedDocs(["b"], base, head)[0].after).toBeNull();
  });

  test("the parent is the one the doc number names, not a stored parentId the depth cap got wrong", () => {
    // Below the heading cap the parser hangs a deep document on a distant ancestor.
    const deep = snap(
      node("g", "A.1.1", 0),
      node("m", "A.1.1.1", 1, "g"),
      node("x", "A.1.1.1.1", 2, "g"),
      node("y", "A.1.1.1.2", 3, "g"),
    );
    const head = snap(node("g", "A.1.1", 0), node("m", "A.1.1.1", 1, "g"), node("x", "A.1.1.1.1", 2, "g"));
    expect(removedDocs(["y"], deep, head)[0]).toMatchObject({ parentId: "m", after: "x" });
  });

  test("a removed doc whose parent is not shown (main already removed it) hangs on the nearest shown ancestor", () => {
    const tree = snap(node("p", "A.1.1", 0), node("x", "A.1.1.1", 1, "p"), node("y", "A.1.1.1.1", 2, "x"));
    expect(removedDocs(["y"], tree, snap(node("p", "A.1.1", 0)))[0].parentId).toBe("p");
  });

  test("a removed subtree keeps its removed parent", () => {
    const tree = snap(node("p", "A.1.1", 0), node("x", "A.1.1.1", 1, "p"), node("y", "A.1.1.1.1", 2, "x"));
    const out = removedDocs(["y", "x"], tree, snap(node("p", "A.1.1", 0)));
    expect(out.map((d) => [d.id, d.parentId])).toEqual([["x", "p"], ["y", "x"]]);
  });
});
