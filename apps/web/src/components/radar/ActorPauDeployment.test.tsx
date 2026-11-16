// @vitest-environment jsdom
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import type { StoredPauSnapshot } from "../../lib/pau";
import { PauDeployment } from "./ActorPauDeployment";

vi.mock("../../lib/pau", async (orig) => ({ ...(await orig<typeof import("../../lib/pau")>()), loadPauHistory: () => new Promise(() => {}) }));
vi.mock("./PauWiring", () => ({ PauWiring: () => null }));
vi.mock("./PauContracts", () => ({ PauContracts: () => null }));
vi.mock("./PauPlumbing", () => ({ PauPlumbing: () => null }));
vi.mock("./ActorPauHolders", () => ({ PauHolders: () => null }));
vi.mock("./ActorPauFacets", () => ({ PauFacets: () => null }));
vi.mock("./ActorPauParams", () => ({ PauParams: () => null }));
vi.mock("./ActorPauRateLimits", () => ({ PauRateLimits: () => null }));

const snap = { deployment: "p:ethereum:monolithic", prime: "p", primeName: "Spark", chain: "ethereum", kind: "monolithic", fetchedAt: "2026-11-16T14:02:45Z", contracts: [] } as unknown as StoredPauSnapshot;

describe("PauDeployment read time", () => {
  it("shows the snapshot's read time beside the deployment name, not at the foot of the section", () => {
    const { container } = render(<PauDeployment snap={snap} keyIndex={new Map()} verdicts={new Map()} anchor={{ id: "ethereum", aliases: [] }} />);
    const summary = container.querySelector("summary")!;
    expect(summary.querySelector("[data-source='onchain']")).toHaveTextContent("on-chain · read 2026-11-16 14:02 UTC");
    expect(container.querySelector("details > p")).toBeNull();
  });
});
