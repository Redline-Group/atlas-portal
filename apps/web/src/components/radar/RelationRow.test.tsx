// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ActorRelation } from "../../lib/actorIndex";
import { RelationRow } from "./RelationRow";

afterEach(cleanup);

const relation = (sourceDocs: ActorRelation["sourceDocs"] = []): ActorRelation => ({
  edge: { f: "a", ft: "entity", t: "b", tt: "entity", e: "facilitates" },
  sourceDocs,
  direction: "outbound",
  otherLabel: "Other Party",
  otherId: "b",
  otherSlug: "other",
  otherEt: "agent",
});

describe("RelationRow source documents", () => {
  it("links each doc the edge was read from, and leaves an unresolved one as text", () => {
    render(<RelationRow r={relation([{ docNo: "A.1.2", id: "uuid-12" }, { docNo: "A.9.9", id: null }])} />);
    expect(screen.getByRole("link", { name: "A.1.2" })).toHaveAttribute("href", "/atlas?id=uuid-12");
    expect(screen.queryByRole("link", { name: "A.9.9" })).toBeNull();
    expect(screen.getByText(/A\.9\.9/)).toBeInTheDocument();
  });

  it("lists a doc number as text when no document resolved for it", () => {
    render(<RelationRow r={relation([{ docNo: "A.1.2", id: null }])} />);
    expect(screen.queryByRole("link", { name: "A.1.2" })).toBeNull();
    expect(screen.getByText(/from/)).toHaveTextContent("A.1.2");
  });

  it("shows no source line for an edge with no source docs", () => {
    render(<RelationRow r={relation()} />);
    expect(screen.queryByText(/from/)).toBeNull();
  });
});
