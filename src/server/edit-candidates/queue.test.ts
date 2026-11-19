import { describe, expect, test } from "bun:test";
import { citersOf, settledRemovals, sweepQueue, type SweepPlan } from "./queue.ts";

const plan = (over: Partial<SweepPlan>): SweepPlan => ({ new: [], changed: [], removed: [], linkedBecause: {}, ...over });
const never = () => false;

describe("sweepQueue", () => {
  test("a citer goes immediately before the target that moved", () => {
    const p = plan({ new: ["n1"], changed: ["c1", "c2"], linkedBecause: { citerA: ["c2"], citerB: ["c2", "n1"] } });
    expect(sweepQueue(p, 100, never)).toEqual(["citerB", "n1", "c1", "citerA", "c2"]);
  });

  test("citers of a removed document are read first, and the removed document is not queued", () => {
    const p = plan({ new: ["n1"], removed: ["gone"], linkedBecause: { citer: ["gone"] } });
    expect(sweepQueue(p, 100, never)).toEqual(["citer", "n1"]);
  });

  test("the cap cuts between groups, never inside one", () => {
    const p = plan({ changed: ["c1", "c2", "c3"], linkedBecause: { a: ["c1"], b: ["c1"] } });
    expect(sweepQueue(p, 2, never)).toEqual(["a", "b", "c1"]);
  });

  test("a parked target takes its citers out with it", () => {
    const p = plan({ changed: ["c1", "c2"], linkedBecause: { a: ["c1"] } });
    expect(sweepQueue(p, 100, (id) => id === "c1")).toEqual(["c2"]);
  });
});

describe("removals", () => {
  const p = plan({ removed: ["gone", "lonely"], linkedBecause: { a: ["gone"], b: ["gone"] } });
  test("citersOf inverts the link map", () => {
    expect(citersOf(p).get("gone")).toEqual(["a", "b"]);
  });
  test("a removed document is settled only once every citer has been read", () => {
    expect(settledRemovals(p, new Set(["a"]))).toEqual(["lonely"]);
    expect(settledRemovals(p, new Set(["a", "b"]))).toEqual(["gone", "lonely"]);
  });
});
