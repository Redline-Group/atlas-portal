// @vitest-environment jsdom
// Every parameter row is our extraction from the Atlas text, so each carries the
// derived symbol in the mark column, just before its check against the chain.
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { RowMark } from "../../lib/rowMark";
import { ParamLine } from "./ParamLine";
import { ParamValueLine } from "./ParamValueLine";

afterEach(cleanup);

const match: RowMark = { mark: "match", head: "Matches the chain", docId: null, lines: [] };

describe("ParamLine mark column", () => {
  it("puts the derived symbol on a row with no check, with no check slot beside it", () => {
    const { container } = render(<ParamLine p={{ key: "Token Name", value: "Spark", srcDocId: null }} colWidth={60} instanceHint="i" />);
    expect(container.querySelectorAll("[data-source='derived']")).toHaveLength(1);
    expect(container.querySelector("[data-check]")).toBeNull();
  });

  it("puts the derived symbol right before the check mark, in the same column, on every row of a card", () => {
    const { container } = render(
      <>
        <ParamLine p={{ key: "A", value: "1", srcDocId: null }} colWidth={60} instanceHint="i" mark={match} markCol />
        <ParamLine p={{ key: "B", value: "2", srcDocId: null }} colWidth={60} instanceHint="i" mark={null} markCol />
      </>,
    );
    const derived = [...container.querySelectorAll("[data-source='derived']")];
    expect(derived).toHaveLength(2);
    // The check slot is always there on a card with checks, empty or not, so the two symbols line up row to row.
    for (const d of derived) expect(d.nextElementSibling).toHaveClass("w-4");
    expect(derived[0].nextElementSibling).toHaveAttribute("data-check", "match");
    expect(derived[1].nextElementSibling).not.toHaveAttribute("data-check");
  });

  it("marks the holder lines of a param that lists them in a table, like any other row", () => {
    const value = "Holders:\n\n| Holder | Address |\n|---|---|\n| Alpha | 0x1111111111111111111111111111111111111111 |\n| Beta | 0x2222222222222222222222222222222222222222 |";
    const { container } = render(<ParamValueLine p={{ key: "Holders", value, srcDocId: null }} colWidth={60} instanceHint="i" />);
    const rows = container.querySelectorAll(".group");
    expect(container.querySelectorAll("[data-source='derived']")).toHaveLength(rows.length);
  });
});
