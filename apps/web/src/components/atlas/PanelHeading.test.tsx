// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SourceMark } from "../SourceMark";
import { PanelHeading } from "./PanelHeading";
import { RelatedDocList } from "./RelatedDocList";

afterEach(cleanup);

describe("PanelHeading", () => {
  it("puts the mark after the heading text, in the same row", () => {
    const { container } = render(<PanelHeading mark={<SourceMark source="derived" bare />}>relations · 3</PanelHeading>);
    const heading = container.querySelector("p")!;
    expect(heading).toHaveClass("flex");
    expect(heading.firstChild?.textContent).toBe("relations · 3");
    expect(heading.lastElementChild).toHaveAttribute("data-source", "derived");
  });

  it("draws no mark for an Atlas-text list, and the margin is the caller's", () => {
    const { container } = render(<PanelHeading className="mb-4">linked documents · 2</PanelHeading>);
    expect(container.querySelector("[data-source]")).toBeNull();
    expect(container.querySelector("p")).toHaveClass("mb-4");
  });

  it("is the heading RelatedDocList uses, so a list's mark lands beside its count", () => {
    const { container } = render(<RelatedDocList label="cousin documents" kind="cousin_doc" items={[]} onNav={() => {}} mark={<SourceMark source="derived" bare />} />);
    expect(container.querySelector("p")?.textContent).toContain("cousin documents · 0");
    expect(container.querySelector("p [data-source='derived']")).not.toBeNull();
  });
});
