// @vitest-environment jsdom

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ActorContracts } from "./ActorContracts";
import type { GraphEntity } from "@/types";

afterEach(cleanup);

const params = { "StarGuard Max Delay": ["The Test Halo StarGuard `maxDelay` is seven (7) days.", "ca45b70f-b230-4d2c-85ae-61e63be78c26", "A.1.14.6.3.1.2.1"] };
const entity = (st: string): GraphEntity => ({ id: "h", slug: "test-halo", name: "Test Halo", et: "agent", st, did: "h", m: JSON.stringify({ params }) }) as GraphEntity;

describe("ActorContracts", () => {
  it("lists a Halo Agent's own params with the document that states each", () => {
    render(<ActorContracts entity={entity("halo")} />);
    expect(screen.getByRole("heading", { name: "Contracts" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "StarGuard Max Delay" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A.1.14.6.3.1.2.1" })).toBeInTheDocument();
  });

  it("renders nothing for an agent that is not a Halo", () => {
    const { container } = render(<ActorContracts entity={entity("prime")} />);
    expect(container).toBeEmptyDOMElement();
  });
});
