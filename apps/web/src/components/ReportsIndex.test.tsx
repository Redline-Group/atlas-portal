// @vitest-environment jsdom
import { it, expect, describe, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { ReportsIndex } from "./ReportsIndex";
import { REPORT_GROUPS } from "@/lib/reportCatalog";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hits: [] }),
    }),
  );
});

function wrap(path = "/reports") {
  const { hook } = memoryLocation({ path, record: true });
  return ({ children }: { children: React.ReactNode }) => <Router hook={hook}>{children}</Router>;
}

describe("ReportsIndex", () => {
  it("renders every subject group with its hint when query is empty", () => {
    render(<ReportsIndex query="" />, { wrapper: wrap() });

    expect(screen.getByRole("heading", { name: "Reports", level: 1 })).toBeInTheDocument();
    for (const g of REPORT_GROUPS) {
      expect(screen.getByText(g.title)).toBeInTheDocument();
      expect(screen.getByText(g.hint)).toBeInTheDocument();
    }
    // A representative card from three different groups.
    expect(screen.getByText("Operational Facilitator Responsibilities")).toBeInTheDocument();
    expect(screen.getByText("Active Data Index")).toBeInTheDocument();
    expect(screen.getByText("Edit Candidates")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("explains that reports are rebuilt on open and that some use more than the Atlas", () => {
    render(<ReportsIndex query="" />, { wrapper: wrap() });
    expect(screen.getByText(/No chip means Atlas text only/)).toBeInTheDocument();
  });

  it("marks each card with the sources it draws on besides the Atlas", () => {
    render(<ReportsIndex query="" />, { wrapper: wrap() });
    const chips = (title: string) =>
      [...screen.getByText(title).closest("a")!.querySelectorAll("[data-source]")].map((e) => e.getAttribute("data-source"));

    expect(chips("Atlas Processes")).toEqual(["curated"]);
    for (const title of ["OEA Task Assessment", "Risk Rules Assessment"]) {
      expect(chips(title)).toEqual(["ai"]);
    }
    expect(chips("Edit Candidates")).toEqual(["onchain", "external", "derived", "ai"]);
    // A report can draw on several classes at once, listed in registry order.
    expect(chips("Stale Dates")).toEqual(["external", "derived", "ai"]);
    expect(chips("Active Data Index")).toEqual(["derived"]);
    // Chips on a card are plain spans: the card is itself a link.
    expect(screen.getByText("Atlas Processes").closest("a")!.querySelector("a")).toBeNull();
  });

  it("filters cards by title match, dropping emptied groups", () => {
    render(<ReportsIndex query="reward" />, { wrapper: wrap() });

    expect(screen.getByRole("link", { name: /Integrator Reward Relationships/ })).toBeInTheDocument();
    expect(screen.getByText("On-chain & money")).toBeInTheDocument();
    expect(screen.queryByText("Roles & duties")).toBeNull();
    expect(screen.queryByText("Atlas health")).toBeNull();
  });

  it("filters cards by description match too", () => {
    render(<ReportsIndex query="csv export" />, { wrapper: wrap() });
    expect(screen.getByRole("link", { name: /Active Data Index/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /On-Chain Addresses/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Integrator Reward Relationships/ })).toBeNull();
  });

  it("filters by source word, so 'curated' narrows to the reports that use hand-maintained lists", () => {
    render(<ReportsIndex query="curated" />, { wrapper: wrap() });

    expect(screen.getByText("Atlas Processes")).toBeInTheDocument();
    expect(screen.queryByText("Edit Candidates")).toBeNull();
    expect(screen.queryByText("Active Data Index")).toBeNull();
  });

  it("a category match keeps every report in that group", () => {
    render(<ReportsIndex query="atlas health" />, { wrapper: wrap() });
    expect(screen.getByRole("heading", { name: /Atlas health/i })).toBeInTheDocument();
    expect(screen.queryByText("Roles & duties")).toBeNull();
    expect(screen.getByRole("link", { name: /Edit Candidates/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Stale Dates/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Operational Facilitator Responsibilities/ })).toBeNull();
  });

  it("unions server semantic hits with the lexical filter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ hits: ["onchain-addresses"] }),
      }),
    );
    render(<ReportsIndex query="wallet addresses" />, { wrapper: wrap() });
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /On-Chain Addresses/ })).toBeInTheDocument();
    });
    expect(screen.getByText(/Closest meaning, not an exact wording match/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/reports/search?q=wallet%20addresses",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("keeps a name match and lists meaning extras under Closest meaning", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ hits: ["rewards", "onchain-addresses"] }),
      }),
    );
    render(<ReportsIndex query="reward" />, { wrapper: wrap() });
    expect(screen.getByRole("link", { name: /Integrator Reward Relationships/ })).toBeInTheDocument();
    expect(screen.queryByText(/Closest meaning/)).toBeNull();
    await waitFor(() => {
      expect(screen.getByText(/Closest meaning, not an exact wording match/)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /On-Chain Addresses/ })).toBeInTheDocument();
  });

  it("highlights a punctuation-tolerant category match as one mark", () => {
    render(<ReportsIndex query="on chain" />, { wrapper: wrap() });
    const heading = screen.getByRole("heading", { name: /On-chain & money/i });
    expect([...heading.querySelectorAll("mark.q-mark")].map((m) => m.textContent)).toContain("On-chain");
  });

  it("shows a no-results message when nothing matches, quoting the raw query", async () => {
    render(<ReportsIndex query="zzz-nonexistent" />, { wrapper: wrap() });
    await waitFor(() => {
      expect(screen.getByText('No reports match "zzz-nonexistent".')).toBeInTheDocument();
    });
    for (const g of REPORT_GROUPS) expect(screen.queryByText(g.title)).toBeNull();
  });

  it("links each card to its report route", () => {
    render(<ReportsIndex query="" />, { wrapper: wrap() });
    const link = screen.getByRole("link", { name: /Integrator Reward Relationships/ });
    expect(link).toHaveAttribute("href", "/reports/rewards");
  });
});
