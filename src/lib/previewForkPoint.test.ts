import { describe, expect, it } from "vitest";
import { candidateKey, forkPointOf } from "./previewForkPoint";

const bases = {
  auto: "sky",
  sky: { repo: "sky-ecosystem/next-gen-atlas", ref: "main", mergeBase: "abcdef1234567", mergeBaseDate: "2026-10-01T00:00:00Z" },
};

describe("forkPointOf", () => {
  it("is the named base's merge base, short, with its date; the auto base by default", () => {
    const fork = { repo: "sky-ecosystem/next-gen-atlas", ref: "main", sha: "abcdef1", date: "2026-10-01T00:00:00Z" };
    expect(forkPointOf(bases, "sky")).toEqual(fork);
    expect(forkPointOf(bases)).toEqual(fork);
  });

  it("is null when comparing to main as it is now, or with no merge base recorded", () => {
    expect(forkPointOf({ auto: "live-main" }, "live-main")).toBeNull();
    expect(forkPointOf(undefined)).toBeNull();
    expect(forkPointOf(bases, "repo")).toBeNull();
  });
});

describe("candidateKey", () => {
  it("keeps the two candidate keys and drops anything else", () => {
    expect(candidateKey("sky")).toBe("sky");
    expect(candidateKey("repo")).toBe("repo");
    expect(candidateKey("live-main")).toBeNull();
    expect(candidateKey(undefined)).toBeNull();
  });
});
