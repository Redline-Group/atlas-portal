import { describe, expect, it } from "vitest";
import { paramGrid } from "./paramGrid.ts";

const PHASES = "The subscribe rate limit has the following values:\n\n| Phase | `maxAmount` | `slope` |\n| --- | --- | --- |\n| 1 | 5,000,000 USDS | 1,000,000 USDS per day |\n| 2 | 5,000,000 USDS | 2,500,000 USDS per day |\n\nIt does not change otherwise.";

describe("paramGrid", () => {
  it("splits a table of several columns from the text around it, unticking its cells", () => {
    expect(paramGrid(PHASES)).toEqual({
      lead: "The subscribe rate limit has the following values:",
      header: ["Phase", "maxAmount", "slope"],
      rows: [["1", "5,000,000 USDS", "1,000,000 USDS per day"], ["2", "5,000,000 USDS", "2,500,000 USDS per day"]],
      note: "It does not change otherwise.",
    });
  });
  it("declines a value with no table, an empty table, and a row that does not fit its header", () => {
    expect(paramGrid("50,000,000 USDS")).toBeNull();
    expect(paramGrid("| A | B |\n| --- | --- |")).toBeNull();
    expect(paramGrid("| A | B |\n| --- | --- |\n| 1 |")).toBeNull();
  });
});
