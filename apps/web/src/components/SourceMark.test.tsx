// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SOURCE_CLASS_IDS, SOURCE_CLASSES, sourceHref } from "@/lib/provenance/sources";
import { SourceMark, SourceMarks } from "./SourceMark";

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
