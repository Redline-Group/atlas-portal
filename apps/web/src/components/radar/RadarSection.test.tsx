// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Section } from "./RadarSection";

afterEach(cleanup);

describe("Section", () => {
  it("puts no mark beside an Atlas-text section", () => {
    const { container } = render(<Section title="Contact"><p>x</p></Section>);
    expect(container.querySelector("[data-source]")).toBeNull();
  });

  it("names the class beside the heading, with the detail on hover", () => {
    render(<Section title="Relationships" source="derived" sourceHint="Edges the app extracted."><p>x</p></Section>);
    const mark = screen.getByRole("link", { name: /derived/ });
    expect(mark.getAttribute("title")).toContain("Edges the app extracted.");
    expect(screen.getByRole("heading", { name: "Relationships", level: 2 })).toBeInTheDocument();
  });
});
