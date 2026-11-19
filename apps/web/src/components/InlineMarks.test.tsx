// @vitest-environment jsdom
// Inside a page, marks are symbols next to the data (no outline, the word kept for
// screen readers); the full labelled chip stays at the top of a page. An inline
// symbol opens its legend entry in a new tab so a click never leaves the page.
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ActiveDataTable } from "./reports/ActiveDataTable";
import { ActorChain } from "./radar/ActorChain";
import { SourceMark } from "./SourceMark";
import { EMPTY_QUERY } from "@/lib/reportFilter";

afterEach(cleanup);

const inline = (c: HTMLElement) => [...c.querySelectorAll("[data-source]")];

describe("inline marks", () => {
  it("shows a table header's mark as a symbol with no outline", () => {
    const { container } = render(<ActiveDataTable rows={[]} rq={EMPTY_QUERY} lastEditDates={new Map()} />);
    const marks = inline(container);
    expect(marks).toHaveLength(3);
    for (const m of marks) expect(m.className).not.toContain("border");
  });

  it("shows a section heading's mark as a symbol too", () => {
    const { container } = render(<ActorChain chain={{ primes: [{ id: "p", slug: "p2", name: "P", et: "agent", st: "prime", docId: null }], executors: [], facilitators: [], govops: [] }} currentSlug="me" />);
    expect(inline(container)[0].className).not.toContain("border");
  });

  it("opens an inline symbol's legend entry in a new tab, and a labelled chip in the app", () => {
    const { container } = render(
      <>
        <SourceMark source="ai" bare />
        <SourceMark source="ai" />
      </>,
    );
    const [symbol, chip] = [...container.querySelectorAll("a")];
    expect(symbol).toHaveAttribute("target", "_blank");
    expect(symbol).toHaveAttribute("rel", "noopener noreferrer");
    expect(chip).not.toHaveAttribute("target");
  });
});
