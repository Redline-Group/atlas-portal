// @vitest-environment jsdom
// usePreviewPatch builds the open document's redline in the browser: the old
// side from before.json / removed.json, the new side from the preview's docs.
import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import type { PreviewDiff } from "./previewDiff";

let preview: unknown = { id: "p", sha: "deadbeef" };
let diff: PreviewDiff;
const loadBefore = vi.fn();
vi.mock("./dataSource", () => ({ useDataSource: () => ({ base: "/api/preview/p/", preview }) }));
vi.mock("./previewDiff", () => ({ usePreviewDiff: () => diff }));
vi.mock("./previewOldSide", () => ({ loadPreviewBefore: (...a: unknown[]) => loadBefore(...a) }));
vi.mock("./docs", () => ({
  loadAtlas: () =>
    Promise.resolve({
      docs: {
        n1: { id: "n1", doc_no: "A.1", title: "One", type: "Core", content: "new body" },
        n2: { id: "n2", doc_no: "A.2", title: "Two", type: "Core", content: "moved body\nplus" },
      },
    }),
}));

import { usePreviewPatch } from "./previewPatchHook";

const base = (over: Partial<PreviewDiff>): PreviewDiff => ({
  added: new Set(),
  changed: new Set(),
  renumbered: {},
  retitled: {},
  retyped: {},
  reusedSlot: {},
  identitySwap: {},
  formerUuid: {},
  activeBase: null,
  ...over,
});

afterEach(() => {
  cleanup();
  loadBefore.mockReset();
  preview = { id: "p", sha: "deadbeef" };
});

describe("usePreviewPatch", () => {
  it("is null outside preview, without fetching", () => {
    preview = null;
    diff = base({ changed: new Set(["n1"]) });
    const { result } = renderHook(() => usePreviewPatch("n1"));
    expect(result.current).toBeNull();
    expect(loadBefore).not.toHaveBeenCalled();
  });

  it("is null for a document the preview did not change", () => {
    diff = base({});
    const { result } = renderHook(() => usePreviewPatch("n1"));
    expect(result.current).toBeNull();
    expect(loadBefore).not.toHaveBeenCalled();
  });

  it("diffs a changed document's old side against the preview's text, whole document", async () => {
    diff = base({ changed: new Set(["n1"]) });
    loadBefore.mockResolvedValue({ n1: { doc_no: "A.1", title: "One", type: "Core", content: "old body" } });
    const { result } = renderHook(() => usePreviewPatch("n1"));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current![0]).toEqual(["=", "A.1 - One [Core] <!-- UUID: n1 -->"]);
    expect(result.current![1][0]).toBe("~");
  });

  it("never shows the previous document's lines while the next one loads", async () => {
    diff = base({ changed: new Set(["n1", "n2"]) });
    loadBefore.mockResolvedValueOnce({ n1: { doc_no: "A.1", title: "One", type: "Core", content: "old body" } });
    const { result, rerender } = renderHook(({ id }) => usePreviewPatch(id), { initialProps: { id: "n1" } });
    await waitFor(() => expect(result.current).not.toBeNull());
    loadBefore.mockReturnValueOnce(new Promise(() => {}));
    rerender({ id: "n2" });
    expect(result.current).toBeNull();
  });

  it("reads the keyed before file for the active base", async () => {
    diff = base({ changed: new Set(["n1"]), activeBase: { key: "repo", repo: "a/b", ref: "main", auto: true } });
    loadBefore.mockResolvedValue({});
    renderHook(() => usePreviewPatch("n1"));
    await waitFor(() => expect(loadBefore).toHaveBeenCalledWith("/api/preview/p/", "repo"));
  });

  it("shows a corroborated identity swap as the new document only", async () => {
    diff = base({ changed: new Set(["n1"]), identitySwap: { n1: { oldTitle: "Old", newTitle: "One", movedTo: { id: "n2", doc_no: "A.2", title: "Two" } } } });
    loadBefore.mockResolvedValue({ n1: { doc_no: "A.1", title: "Old", content: "old body" } });
    const { result } = renderHook(() => usePreviewPatch("n1"));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current!.every((l) => l[0] === "+")).toBe(true);
  });

  it("diffs content that moved in from another UUID against that UUID's old text", async () => {
    diff = base({ added: new Set(["n2"]), formerUuid: { n2: { previousId: "n1", previousTitle: "Old", previousDocNo: "A.1" } } });
    loadBefore.mockResolvedValue({ n1: { doc_no: "A.1", title: "Old", content: "moved body" } });
    const { result } = renderHook(() => usePreviewPatch("n2"));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current!.slice(1)).toEqual([["=", "moved body"], ["+", "plus"]]);
  });

  it("shows a removed document as all removals", async () => {
    const gone = { id: "g", doc_no: "A.9", title: "Gone", content: "bye", parentId: null, after: null, depth: 1 };
    diff = base({ removed: new Set(["g"]), removedDocs: [gone] });
    loadBefore.mockResolvedValue({});
    const { result } = renderHook(() => usePreviewPatch("g"));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual([["-", "A.9 - Gone <!-- UUID: g -->"], ["-", "bye"]]);
  });
});
