// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { AtlasNode } from "@/types";
import { PanelNotes } from "./PanelNotes";

afterEach(cleanup);

const node = (id: string, doc_no: string): AtlasNode =>
  ({ id, doc_no, title: `Title ${doc_no}`, type: "Core", content: "", depth: 1, parentId: null }) as unknown as AtlasNode;

const base = {
  id: "d1",
  annotationDocs: [],
  linkedNodes: [node("l1", "A.1.1")],
  cousinDocs: [],
  citedBy: [],
  relations: [],
  onNav: vi.fn(),
  onNavDoc: vi.fn(),
};

describe("right panel notes: derived lists", () => {
  it("marks the cousin list and the relations list as derived, and leaves linked documents unmarked", () => {
    const { container } = render(
      <PanelNotes
        {...base}
        cousinDocs={[{ node: node("c1", "A.2.1"), agent: "Spark" }]}
        relations={[{ edge: { f: "d1", ft: "doc", t: "x", tt: "entity", e: "references", s: ["A.1.1"] }, isOut: true } as never]}
      />,
    );
    const heads = [...container.querySelectorAll("p")].filter((p) => p.querySelector("[data-source='derived']"));
    // Cousins come last in the notes, after the relations.
    expect(heads.map((p) => p.textContent)).toEqual([
      expect.stringContaining("relations"),
      expect.stringContaining("cousin documents"),
    ]);
    const linked = [...container.querySelectorAll("p")].find((p) => p.textContent?.startsWith("linked documents"));
    expect(linked?.querySelector("[data-source]")).toBeNull();
  });

  it("marks the cited-by list as derived", () => {
    const { container } = render(<PanelNotes {...base} linkedNodes={[]} citedBy={[{ f: "x", s: ["A.9.9"] } as never]} />);
    const head = [...container.querySelectorAll("p")].find((p) => p.textContent?.startsWith("cited by"))!;
    expect(head.querySelector("[data-source='derived']")).not.toBeNull();
  });
});
