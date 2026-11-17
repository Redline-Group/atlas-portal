// @vitest-environment jsdom
// The Primitives page's note about chain checks follows the rows: the marks
// object exists once the snapshots load, but the note is true only when a row
// has a check to show.
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { RadarInstance, RadarPrimitive } from "../../lib/actorIndex";

const state = vi.hoisted(() => ({ marks: {} as object | null, anyMarked: false }));
vi.mock("../../hooks/usePrimeAtlasChecks", () => ({ usePrimeCardMarks: () => state.marks }));
vi.mock("../../lib/cardMarkUse", () => ({ anyRowMarked: () => state.anyMarked }));
vi.mock("./InstanceCard", () => ({ InstanceCard: () => <div /> }));

const { ActorInstances } = await import("./ActorInstances");

afterEach(cleanup);

const primitives = [
  { title: "P", docId: null, st: "dr", category: "Genesis Primitives", categoryDocId: null, categoryOrder: 0, status: null, statusDocId: null, isUnknown: false, invocations: [], instances: [{ id: "i1", slug: "i1", displayName: "I", status: "Active", docId: null, signalParams: [] } as unknown as RadarInstance] },
] as RadarPrimitive[];

const note = (marked: boolean, marks: object | null) => {
  state.marks = marks;
  state.anyMarked = marked;
  const { container } = render(<ActorInstances primitives={primitives} prime={{ id: "p", slug: "p" }} />);
  return { classes: [...container.querySelectorAll("[data-source]")].map((e) => e.getAttribute("data-source")), text: container.textContent ?? "" };
};

describe("ActorInstances chain-check note", () => {
  it("claims chain checks only when a row has one", () => {
    const some = note(true, {});
    expect(some.classes).toEqual(["derived", "onchain"]);
    expect(some.text).toContain("a mark beside one checks it against the chain");
    cleanup();
    const none = note(false, {});
    expect(none.classes).toEqual(["derived"]);
    expect(none.text).not.toContain("checks it against the chain");
  });

  it("claims none while the marks have not loaded", () => {
    expect(note(false, null).classes).toEqual(["derived"]);
  });
});
