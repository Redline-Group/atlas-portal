import { describe, expect, it } from "vitest";
import { withRemovedDocs } from "./previewRemoved";
import type { AtlasBundle } from "./docs";
import type { AtlasNode } from "@/types";
import type { RemovedDoc } from "@/lib/previewPatch";

const node = (id: string, parentId: string | null, order: number): AtlasNode => ({
  id, doc_no: `A.${id}`, title: id, type: "Core", depth: parentId ? 2 : 1, parentId, content: "", order, addressRefs: [],
});
const gone = (id: string, parentId: string | null, after: string | null): RemovedDoc => ({
  id, doc_no: `A.${id}`, title: id, content: `body ${id}`, parentId, after, depth: 2,
});

function bundle(nodes: AtlasNode[]): AtlasBundle {
  const byParent = new Map<string | null, AtlasNode[]>();
  for (const n of nodes) byParent.set(n.parentId, [...(byParent.get(n.parentId) ?? []), n]);
  return { docs: Object.fromEntries(nodes.map((n) => [n.id, n])), byParent, docNoToId: new Map(nodes.map((n) => [n.doc_no, n.id])), atlasCommit: null };
}

describe("withRemovedDocs", () => {
  const b = bundle([node("p", null, 0), node("a", "p", 1), node("d", "p", 4)]);

  it("is the same bundle when nothing was removed", () => {
    expect(withRemovedDocs(b, [])).toBe(b);
    expect(withRemovedDocs(b, undefined)).toBe(b);
  });

  it("puts each removed doc after its anchor, in order, without touching the original", () => {
    const out = withRemovedDocs(b, [gone("b", "p", "a"), gone("c", "p", "b")]);
    expect(out.byParent.get("p")!.map((n) => n.id)).toEqual(["a", "b", "c", "d"]);
    expect(out.docs.c.content).toBe("body c");
    expect(b.byParent.get("p")!.map((n) => n.id)).toEqual(["a", "d"]);
    expect(b.docs.c).toBeUndefined();
  });

  it("puts a removed first child first, and nests a removed subtree under its removed parent", () => {
    const out = withRemovedDocs(b, [gone("x", "p", null), gone("y", "x", null)]);
    expect(out.byParent.get("p")![0].id).toBe("x");
    expect(out.byParent.get("x")!.map((n) => n.id)).toEqual(["y"]);
  });

  it("leaves out a removed doc whose parent is not loaded, and never touches doc-number lookups", () => {
    const out = withRemovedDocs(b, [gone("z", "deep-parent", null), gone("b", "p", "a")]);
    expect(out.docs.z).toBeUndefined();
    expect(out.docNoToId.has("A.b")).toBe(false);
  });
});
