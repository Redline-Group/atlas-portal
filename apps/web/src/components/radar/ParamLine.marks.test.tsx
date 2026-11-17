// @vitest-environment jsdom
// Every parameter row is our extraction from the Atlas text, so each shows the
// derived symbol in the one mark column, in the slot the check against the chain
// takes when the row has one. A row never shows both.
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { RowMark } from "../../lib/rowMark";
import { ParamLine } from "./ParamLine";
import { ParamValueLine } from "./ParamValueLine";

afterEach(cleanup);

const match: RowMark = { mark: "match", head: "Matches the chain", docId: null, lines: [] };
const slot = (c: HTMLElement) => [...c.querySelectorAll("span.w-4")];

describe("ParamLine mark column", () => {
  it("shows the derived symbol in the column on a row with no check", () => {
    const { container } = render(<ParamLine p={{ key: "Token Name", value: "Spark", srcDocId: null }} colWidth={60} instanceHint="i" />);
    expect(slot(container)).toHaveLength(1);
    expect(slot(container)[0].querySelector("[data-source='derived']")).not.toBeNull();
  });

  it("puts the check in the same slot instead of the derived symbol, so a row has one symbol", () => {
    const { container } = render(
      <>
        <ParamLine p={{ key: "A", value: "1", srcDocId: null }} colWidth={60} instanceHint="i" mark={match} />
        <ParamLine p={{ key: "B", value: "2", srcDocId: null }} colWidth={60} instanceHint="i" mark={null} />
      </>,
    );
    const [checked, unchecked] = slot(container);
    expect(checked).toHaveAttribute("data-check", "match");
    expect(checked.querySelector("[data-source]")).toBeNull();
    expect(unchecked.querySelector("[data-source='derived']")).not.toBeNull();
    expect(container.querySelectorAll("[data-source='derived']")).toHaveLength(1);
  });

  it("marks the holder lines of a param that lists them in a table, like any other row", () => {
    const value = "Holders:\n\n| Holder | Address |\n|---|---|\n| Alpha | 0x1111111111111111111111111111111111111111 |\n| Beta | 0x2222222222222222222222222222222222222222 |";
    const { container } = render(<ParamValueLine p={{ key: "Holders", value, srcDocId: null }} colWidth={60} instanceHint="i" />);
    expect(container.querySelectorAll("[data-source='derived']")).toHaveLength(container.querySelectorAll(".group").length);
  });
});
