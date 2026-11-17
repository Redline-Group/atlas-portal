// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SOURCE_CLASS_IDS, SOURCE_CLASSES, sourceHref } from "@/lib/provenance/sources";
import { SourceMark, SourceMarks } from "./SourceMark";
import { LinkMark } from "./chat/LinkMark";
import { MARK_COLOR, MARK_TEXT } from "./markStyle";

afterEach(cleanup);

describe("SourceMark", () => {
  it.each(SOURCE_CLASS_IDS)("shows the %s word at rest and links to its /provenance entry", (id) => {
    render(<SourceMark source={id} />);
    const mark = screen.getByRole("link", { name: new RegExp(SOURCE_CLASSES[id].word) });
    expect(mark).toHaveAttribute("href", sourceHref(id));
    expect(mark).toHaveAttribute("data-source", id);
    expect(mark).toHaveAttribute("title", SOURCE_CLASSES[id].meaning);
  });

  it("appends detail after the word and to the tooltip", () => {
    render(<SourceMark source="onchain" detail="read 14:02 UTC" />);
    const mark = screen.getByRole("link");
    expect(mark).toHaveTextContent("on-chain · read 14:02 UTC");
    expect(mark.getAttribute("title")).toContain("read 14:02 UTC");
  });

  it("a bare mark keeps the word for assistive tech and drops the chip border", () => {
    render(<SourceMark source="derived" bare />);
    const mark = screen.getByRole("link", { name: "derived" });
    expect(mark.className).not.toContain("border");
  });

  it("an unlinked mark is a span, so it can sit inside another link", () => {
    const { container } = render(<SourceMark source="ai" unlinked />);
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("span[data-source='ai']")).toHaveTextContent("AI");
  });

  it("uses the dotted border that marks non-Atlas content", () => {
    render(<SourceMark source="curated" />);
    expect(screen.getByRole("link").className).toContain("border-dotted");
  });
});

describe("SourceMark plain", () => {
  it("shows the glyph and the word without the dotted outline", () => {
    render(<SourceMark source="onchain" plain unlinked />);
    const mark = document.querySelector("[data-source='onchain']")!;
    expect(mark).toHaveTextContent("on-chain");
    expect(mark.className).not.toContain("border");
    expect(mark.hasAttribute("plain")).toBe(false);
  });
});

describe("SourceMark props", () => {
  it("passes the caller's own props to an unlinked span, with the chip's identity winning", () => {
    let clicked = false;
    const { container } = render(
      <SourceMark source="ai" unlinked id="m1" aria-label="written by a model" data-extra="x" onClick={() => (clicked = true)} />,
    );
    const mark = container.querySelector("span[data-source='ai']")!;
    expect(mark).toHaveAttribute("id", "m1");
    expect(mark).toHaveAttribute("aria-label", "written by a model");
    expect(mark).toHaveAttribute("data-extra", "x");
    fireEvent.click(mark);
    expect(clicked).toBe(true);
  });

  it("keeps its own props off the element: none of them becomes an attribute", () => {
    const { container } = render(<SourceMark source="ai" bare detail="d" hint="h" unlinked />);
    const mark = container.querySelector("[data-source='ai']")!;
    for (const own of ["source", "bare", "detail", "hint", "unlinked"]) expect(mark.hasAttribute(own)).toBe(false);
  });

  it("merges a caller's style with the chip colour instead of replacing it", () => {
    render(<SourceMark source="derived" style={{ marginLeft: 6 }} target="_blank" rel="noopener noreferrer" />);
    const mark = screen.getByRole("link");
    expect(mark).toHaveStyle({ marginLeft: "6px", color: "var(--source-mark)" });
    expect(mark).toHaveAttribute("target", "_blank");
  });

  it("navigates inside the app on a plain click, and leaves a modified click to the browser", () => {
    render(<SourceMark source="onchain" />);
    const mark = screen.getByRole("link");
    expect(fireEvent.click(mark)).toBe(false);
    expect(fireEvent.click(mark, { ctrlKey: true })).toBe(true);
  });
});

describe("shared mark style", () => {
  it("gives the chip and the preview's Δ the same text style and colour", () => {
    const { container } = render(
      <>
        <SourceMark source="derived" unlinked />
        <LinkMark cls="preview" />
      </>,
    );
    for (const mark of container.querySelectorAll("[data-source]")) {
      for (const cls of MARK_TEXT.split(" ")) expect(mark).toHaveClass(cls);
      expect((mark as HTMLElement).style.color).toBe(MARK_COLOR);
    }
  });
});

describe("SourceMarks", () => {
  it("renders nothing for an Atlas-only report", () => {
    const { container } = render(<SourceMarks sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each class once, in registry order, whatever the declared order", () => {
    render(<SourceMarks sources={["curated", "onchain", "ai", "onchain"]} />);
    const order = screen.getAllByRole("link").map((a) => a.getAttribute("data-source"));
    expect(order).toEqual(["onchain", "ai", "curated"]);
  });
});
