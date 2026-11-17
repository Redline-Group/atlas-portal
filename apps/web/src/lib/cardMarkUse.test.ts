import { describe, expect, it, vi } from "vitest";
import type { RadarPrimitive } from "./actorIndex";
import type { CardMarks } from "./rowMark";

const rowMarkFor = vi.fn();
vi.mock("./rowMark", () => ({ rowMarkFor: (...a: unknown[]) => rowMarkFor(...a) }));

const { anyRowMarked } = await import("./cardMarkUse");

const inst = (docId: string, keys: string[]) => ({ docId, signalParams: keys.map((key) => ({ key })) });
const prim = (instances: ReturnType<typeof inst>[], invocations: ReturnType<typeof inst>[] = []) => ({ instances, invocations }) as unknown as RadarPrimitive;
const marks = {} as CardMarks;

describe("anyRowMarked", () => {
  it("is false without marks, and false when marks exist but no row has a check", () => {
    rowMarkFor.mockReturnValue(null);
    expect(anyRowMarked(null, [prim([inst("d", ["k"])])])).toBe(false);
    expect(anyRowMarked(marks, [prim([inst("d", ["a", "b"])])])).toBe(false);
    expect(anyRowMarked(marks, [])).toBe(false);
  });

  it("is true when a row on an instance or an invocation has a check, and stops at the first", () => {
    rowMarkFor.mockReset();
    rowMarkFor.mockImplementation((_m, docId: string) => (docId === "inv" ? { mark: "match" } : null));
    expect(anyRowMarked(marks, [prim([inst("d", ["a"])], [inst("inv", ["x", "y"])])])).toBe(true);
    rowMarkFor.mockReset();
    rowMarkFor.mockReturnValue({ mark: "match" });
    expect(anyRowMarked(marks, [prim([inst("d", ["a", "b", "c"])])])).toBe(true);
    expect(rowMarkFor).toHaveBeenCalledTimes(1);
  });
});
