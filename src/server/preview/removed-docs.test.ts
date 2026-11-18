// Where removed.json places each removed document. Run via `bun test`.
import { describe, expect, test } from "bun:test";
import { removedDocs } from "./removed-docs.ts";
import type { Snapshot, SnapshotDoc } from "./snapshot.ts";

const node = (id: string, parentId: string | null, order: number, over: Partial<SnapshotDoc> = {}): SnapshotDoc => ({
  id,
  doc_no: `A.${id}`,
  title: `T${id}`,
  content: `body ${id}`,
  parentId,
  order,
  depth: parentId ? 2 : 1,
  ...over,
});
const snap = (...docs: SnapshotDoc[]): Snapshot => new Map(docs.map((d) => [d.id, d]));

describe("removedDocs", () => {
  const base = snap(node("p", null, 0), node("a", "p", 1), node("b", "p", 2), node("c", "p", 3), node("d", "p", 4));

  test("each follows the nearest earlier sibling the head kept under the same parent", () => {
    const head = snap(node("p", null, 0), node("a", "p", 1), node("d", "p", 2));
    const out = removedDocs(["c", "b"], base, head);
    expect(out.map((d) => [d.id, d.after])).toEqual([["b", "a"], ["c", "b"]]);
    expect(out[0]).toMatchObject({ doc_no: "A.b", content: "body b", parentId: "p", depth: 2 });
  });

  test("the first child follows nothing", () => {
    const head = snap(node("p", null, 0), node("b", "p", 1));
    expect(removedDocs(["a"], base, head)[0].after).toBeNull();
  });

  test("a sibling the head moved under another parent is skipped as an anchor", () => {
    const head = snap(node("p", null, 0), node("q", null, 1), node("a", "q", 2), node("c", "p", 3));
    expect(removedDocs(["b"], base, head)[0].after).toBeNull();
  });

  test("a removed subtree keeps its parent", () => {
    const tree = snap(node("p", null, 0), node("x", "p", 1), node("y", "x", 2));
    const out = removedDocs(["y", "x"], tree, snap(node("p", null, 0)));
    expect(out.map((d) => [d.id, d.parentId])).toEqual([["x", "p"], ["y", "x"]]);
  });
});
