// @vitest-environment jsdom
// The quiet marks on Radar's remaining surfaces: one chip per section, none per row.
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SourceNote } from "./ActorSettlementSourceNote";
import { CompositePartySection } from "./CompositePartySection";
import { SettlementBars } from "./SettlementBars";
import { PanelGlossary } from "../atlas/PanelGlossary";

afterEach(cleanup);

const classes = (c: HTMLElement) => [...c.querySelectorAll("[data-source]")].map((e) => e.getAttribute("data-source"));

describe("Radar marks", () => {
  it("names the settlement source note's origin as an external record", () => {
    const { container } = render(<SourceNote workbook="https://github.com/soterlabs/settlement-reports/x" month="2026-09" forumUrl={undefined} />);
    expect(classes(container)).toEqual(["external"]);
    expect(container.querySelector("[data-source]")).toHaveTextContent("Soter Labs workbooks");
  });

  it("marks the Composite Party explanation as written by Redline, once", () => {
    const { container } = render(<CompositePartySection members={[]} />);
    expect(classes(container)).toEqual(["curated"]);
  });

  it("marks the derived settlement series once, in the legend", () => {
    const month = { month: "2026-09", sky: 1, kept: 2, demand: 3 };
    const { container } = render(<SettlementBars months={[month]} selected="2026-09" onSelect={() => {}} />);
    expect(classes(container)).toEqual(["derived"]);
  });

  it("says in the glossary panel that terms are matched by the app, while the definitions stay unmarked", () => {
    const { container } = render(<PanelGlossary glossaryTerms={[]} onNav={() => {}} />);
    expect(classes(container)).toEqual(["derived"]);
  });
});
