// @vitest-environment jsdom
// previewFilter derives two preview signals from data-source + diff + view state:
// the "changed only" id set, and per-node dimming of untouched docs. The three
// source hooks are mocked so we test the combination logic in isolation.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("./dataSource", () => ({ useDataSource: vi.fn() }));
vi.mock("./previewDiff", () => ({ usePreviewDiff: vi.fn() }));
vi.mock("./previewView", () => ({ usePreviewView: vi.fn() }));

import { REMOVED_OPACITY, usePreviewChangedSet, usePreviewFade } from "./previewFilter";
import { useDataSource } from "./dataSource";
import { usePreviewDiff } from "./previewDiff";
import { usePreviewView } from "./previewView";

const mockSource = vi.mocked(useDataSource);
const mockDiff = vi.mocked(usePreviewDiff);
const mockView = vi.mocked(usePreviewView);

function configure({
  preview = false,
  onlyChanged = false,
  added = [] as string[],
  changed = [] as string[],
  removed = [] as string[],
}) {
  mockSource.mockReturnValue({ base: "/b/", preview: preview ? { id: "p", sha: "s" } : null });
  mockView.mockReturnValue({ onlyChanged, changeFilters: [] } as unknown as ReturnType<typeof usePreviewView>);
  mockDiff.mockReturnValue({
    added: new Set(added),
    changed: new Set(changed),
    removed: new Set(removed),
    renumbered: {},
    retitled: {},
    retyped: {},
    reusedSlot: {},
    identitySwap: {},
    formerUuid: {},
  });
}

beforeEach(() => {
  mockSource.mockReset();
  mockDiff.mockReset();
  mockView.mockReset();
});

describe("usePreviewChangedSet", () => {
  it("is null outside preview mode", () => {
    configure({ preview: false, onlyChanged: true, added: ["a"] });
    expect(renderHook(() => usePreviewChangedSet()).result.current).toBeNull();
  });

  it("is null when the 'only changed' toggle is off", () => {
    configure({ preview: true, onlyChanged: false, added: ["a"], changed: ["b"] });
    expect(renderHook(() => usePreviewChangedSet()).result.current).toBeNull();
  });

  it("is null while the diff is still pending, so nothing reads as filtered out", () => {
    configure({ preview: true, onlyChanged: true });
    mockDiff.mockReturnValue({ ...mockDiff(), pending: true });
    expect(renderHook(() => usePreviewChangedSet()).result.current).toBeNull();
  });

  it("is the union of added and changed when preview + toggle are on", () => {
    configure({ preview: true, onlyChanged: true, added: ["a"], changed: ["b", "c"] });
    const set = renderHook(() => usePreviewChangedSet()).result.current;
    expect(set).not.toBeNull();
    expect([...set!].sort()).toEqual(["a", "b", "c"]);
  });
});


describe("usePreviewFade", () => {
  it("is full strength outside preview", () => {
    configure({ preview: false, removed: ["r"] });
    expect(renderHook(() => usePreviewFade("r", 0.9)).result.current).toBeUndefined();
  });

  it("draws a removed doc faint, selected or not", () => {
    configure({ preview: true, removed: ["r"] });
    expect(renderHook(() => usePreviewFade("r", 0.9)).result.current).toBe(REMOVED_OPACITY);
    expect(renderHook(() => usePreviewFade("r", 0.9, true)).result.current).toBe(REMOVED_OPACITY);
  });

  it("dims an untouched doc unless it is selected, and leaves a change at full strength", () => {
    configure({ preview: true, added: ["a"] });
    expect(renderHook(() => usePreviewFade("u", 0.9)).result.current).toBe(0.9);
    expect(renderHook(() => usePreviewFade("u", 0.9, true)).result.current).toBeUndefined();
    expect(renderHook(() => usePreviewFade("a", 0.9)).result.current).toBeUndefined();
  });

  it("counts removed docs in the changed-only set", () => {
    configure({ preview: true, onlyChanged: true, added: ["a"], removed: ["r"] });
    expect([...renderHook(() => usePreviewChangedSet()).result.current!].sort()).toEqual(["a", "r"]);
  });
});
