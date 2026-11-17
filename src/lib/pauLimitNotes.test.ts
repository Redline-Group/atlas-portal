import { describe, expect, it } from "vitest";
import { caveatCounts, limitCaveats } from "./pauLimitNotes";

describe("limitCaveats", () => {
  it("flags a missing live read and a missing unit", () => {
    expect(limitCaveats({}, false)).toEqual({ failed: true, inferred: true });
    expect(limitCaveats({ data: {}, unit: {} }, false)).toEqual({ failed: false, inferred: false });
  });
  it("does not call decimals inferred for a limit that is off", () => {
    expect(limitCaveats({ data: {} }, true)).toEqual({ failed: false, inferred: false });
  });
});

describe("caveatCounts", () => {
  it("counts each caveat once per limit", () => {
    const limits = [{ data: {}, unit: {} }, { unit: {} }, {}, { data: {}, off: true }];
    expect(caveatCounts(limits, (r) => "off" in r)).toEqual({ failed: 2, inferred: 1 });
  });
});
