import { describe, it, expect } from "vitest";
import { icdFiling, isStatusDirectory } from "./cousinFiling";

describe("icdFiling", () => {
  it("reads a venue filing: status › chain › venue › ICD", () => {
    expect(icdFiling(["Morpho", "Ethereum Mainnet Instances", "Active Instances"])).toEqual({ kind: "venue", venue: "morpho", completed: false });
    expect(icdFiling(["Aave", "Base", "Completed Instances"])).toEqual({ kind: "venue", venue: "aave", completed: true });
  });

  it("reads a direct filing under a status heading", () => {
    expect(icdFiling(["In Progress Invocations", "Distribution Reward Primitive"])).toEqual({ kind: "direct", completed: false });
    expect(icdFiling(["Completed Instances Directory", "Agent Creation Primitive"])).toEqual({ kind: "direct", completed: true });
  });

  it("never mistakes a chain heading for a status heading or a venue", () => {
    expect(isStatusDirectory("Ethereum Mainnet Instances")).toBe(false);
    // ICD straight under a chain heading: unknown, so cousins narrow instead of matching the whole chain.
    expect(icdFiling(["Ethereum Mainnet Instances", "Active Instances", "Allocation System Primitive"]).kind).toBe("unknown");
    // Venue straight under a status heading (no chain level): unknown too.
    expect(icdFiling(["Morpho", "Active Instances", "Allocation System Primitive"]).kind).toBe("unknown");
  });
});
