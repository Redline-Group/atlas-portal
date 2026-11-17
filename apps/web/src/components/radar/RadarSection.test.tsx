// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SourceMark } from "../SourceMark";
import { Section, SectionTitle } from "./RadarSection";

afterEach(cleanup);

describe("Section", () => {
  it("puts no mark beside an Atlas-text section", () => {
    const { container } = render(<Section title="Contact"><p>x</p></Section>);
    expect(container.querySelector("[data-source]")).toBeNull();
  });

  it("shows the mark it is given beside the title, outside the heading element", () => {
    render(<Section title="Relationships" mark={<SourceMark source="derived" bare hint="Edges the app extracted." />}><p>x</p></Section>);
    const mark = screen.getByRole("link", { name: /derived/ });
    expect(mark.getAttribute("title")).toContain("Edges the app extracted.");
    expect(screen.getByRole("heading", { name: "Relationships", level: 2 })).toBeInTheDocument();
  });

  it("shares the title row with other headings: SectionTitle is the same row Section draws", () => {
    const { container } = render(<SectionTitle title="Related Parties" mark={<SourceMark source="derived" bare />} />);
    const row = container.firstElementChild!;
    expect(row.querySelector("h2")).toHaveTextContent("Related Parties");
    expect(row.querySelector("h2 [data-source]")).toBeNull();
    expect(row.querySelector(":scope > [data-source='derived']")).not.toBeNull();
  });
});
