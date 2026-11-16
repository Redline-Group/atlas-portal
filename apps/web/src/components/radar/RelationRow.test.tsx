// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ActorRelation } from "../../lib/actorIndex";
import { RelationRow } from "./RelationRow";

afterEach(cleanup);

const relation = (s?: string[]): ActorRelation => ({
  edge: { f: "a", ft: "entity", t: "b", tt: "entity", e: "facilitates", ...(s ? { s } : {}) },
  direction: "outbound",
  otherLabel: "Other Party",
  otherId: "b",
  otherSlug: "other",
  otherEt: "agent",
});

describe("RelationRow source documents", () => {
  it("links each doc the edge was read from, and leaves an unresolved one as text", () => {
    render(<RelationRow r={relation(["A.1.2", "A.9.9"])} docNoToId={new Map([["A.1.2", "uuid-12"]])} />);
    expect(screen.getByRole("link", { name: "A.1.2" })).toHaveAttribute("href", "/atlas?id=uuid-12");
    expect(screen.queryByRole("link", { name: "A.9.9" })).toBeNull();
    expect(screen.getByText(/A\.9\.9/)).toBeInTheDocument();
  });

  it("lists the doc numbers as text before the atlas has loaded", () => {
    render(<RelationRow r={relation(["A.1.2"])} />);
    expect(screen.queryByRole("link", { name: "A.1.2" })).toBeNull();
    expect(screen.getByText(/from/)).toHaveTextContent("A.1.2");
  });

  it("shows no source line for an edge with no source docs", () => {
    render(<RelationRow r={relation()} />);
    expect(screen.queryByText(/from/)).toBeNull();
  });
});
