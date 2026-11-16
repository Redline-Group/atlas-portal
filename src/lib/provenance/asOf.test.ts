import { describe, expect, it } from "vitest";
import { formatReadTime, oldestTime } from "./asOf";

describe("formatReadTime", () => {
  it("renders minutes in UTC", () => {
    expect(formatReadTime("2026-11-16T14:02:45.123Z")).toBe("2026-11-16 14:02 UTC");
  });
  it("is null for a missing or unparseable time", () => {
    expect(formatReadTime(null)).toBeNull();
    expect(formatReadTime("")).toBeNull();
    expect(formatReadTime("not a time")).toBeNull();
  });
});

describe("oldestTime", () => {
  it("picks the oldest and skips missing ones", () => {
    expect(oldestTime(["2026-11-16T14:00:00Z", null, "2026-11-15T09:00:00Z", undefined])).toBe("2026-11-15T09:00:00Z");
  });
  it("is null when none parse", () => {
    expect(oldestTime([null, "x"])).toBeNull();
  });
});
