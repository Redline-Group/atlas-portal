// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EMPTY_QUERY } from "@/lib/reportFilter";
import { ActiveDataTable } from "./ActiveDataTable";

afterEach(cleanup);

describe("ActiveDataTable headers", () => {
  it("marks the columns the app worked out as derived, and no others", () => {
    const { container } = render(<ActiveDataTable rows={[]} rq={EMPTY_QUERY} lastEditDates={new Map()} />);
    const marked = [...container.querySelectorAll("th")]
      .filter((th) => th.querySelector("[data-source='derived']"))
      .map((th) => th.firstChild?.textContent?.trim());
    expect(marked).toEqual(["Responsible Party", "Facilitator", "Process"]);
  });
});
