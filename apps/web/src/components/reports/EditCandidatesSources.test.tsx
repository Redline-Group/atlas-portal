// @vitest-environment jsdom
// Edit Candidates with every source answering: stale dates and PAU audit rows
// join the text sweep, the Source and recency pills narrow them, and a derived
// row links to its own report.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { AtlasNode } from "@/types";

const SWEPT = "11111111-1111-4111-8111-111111111111";
const DATED = "22222222-2222-4222-8222-222222222222";
const LIMIT = "33333333-3333-4333-8333-333333333333";

const doc = (id: string, doc_no: string, title: string, content: string): AtlasNode =>
  ({ id, doc_no, title, type: "Core", depth: 3, parentId: null, content, order: 0, addressRefs: [] }) as AtlasNode;

vi.mock("../../hooks/useUTCDay", () => ({ useUTCDay: () => "2026-11-19" }));
vi.mock("../../lib/docs", () => ({
  loadDocs: () =>
    Promise.resolve({
      [SWEPT]: doc(SWEPT, "A.1.1", "Website", "The Sky Ecoystem site."),
      [DATED]: doc(DATED, "A.1.2", "Launch", "The change will be included in the March 5, 2026 Executive Vote."),
      [LIMIT]: doc(LIMIT, "A.6.1", "Rate Limit", "Inflow maxAmount: 5,000,000 USDC"),
    }),
}));
vi.mock("../../lib/graph", () => ({ loadGraph: () => Promise.reject(new Error("no graph")) }));
vi.mock("../../lib/potentialMistakesLoad", () => ({
  loadPotentialMistakes: () =>
    Promise.resolve({
      generatedAt: "2026-11-18T10:00:00Z", atlasSha: "d64eca4800553d21", documentsScanned: 12059, note: "",
      passes: { language: "", factual: "", deterministic: "" },
      findings: [{
        id: "a", docNo: "A.1.1", uuid: SWEPT, file: "A.1.md", category: "typo", severity: "high", pass: "language",
        quote: "Sky Ecoystem", issue: "Misspelling of Ecosystem.", fix: "Sky Ecosystem", firstSeen: "2026-11-18",
      }],
    }),
}));
vi.mock("../../lib/pau", () => ({ loadPau: () => Promise.resolve({ deployments: [{}] }) }));
vi.mock("../../lib/pauAudit", () => ({
  loadPauAudit: () =>
    Promise.resolve([{
      item: "value:limit", group: "atlas", reason: "chain-newer", note: "The chain value was set after the atlas last wrote it, and they disagree.",
      primeId: "p", prime: "Spark", chain: "ethereum", kind: "monolithic", subject: "Instance X", label: "Inflow maxAmount",
      stated: "5,000,000 USDC", onchain: "7,000,000 USDC", docId: LIMIT, key: "0xk", contract: "0xc",
      chainSetAt: "2026-10-30", atlasChangedAt: "2026-04-01", step: null, routes: null,
    }]),
}));
vi.mock("@/lib/history", () => ({
  loadModCounts: () => Promise.resolve([{ docId: DATED, count: 2, lastModified: "2026-11-15", contentCount: 2 }]),
}));

import { PotentialMistakesReport } from "./PotentialMistakesReport";

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
});

const loaded = async () => {
  render(<PotentialMistakesReport query="" mode="broad" />);
  await screen.findByText("3 of 3 candidates");
};

describe("Edit Candidates sources", () => {
  it("lists stale dates and Atlas-versus-chain rows beside the text sweep", async () => {
    await loaded();
    const table = within(screen.getByRole("table"));
    expect(table.getByText("Sky Ecoystem")).toBeInTheDocument();
    expect(table.getByText(/March 5, 2026 as upcoming, and that date passed/)).toBeInTheDocument();
    expect(table.getByText(/On chain: 7,000,000 USDC\./)).toBeInTheDocument();
    for (const li of screen.getAllByRole("listitem")) expect(li).toHaveAttribute("data-state", "ready");
    // The sweep line shows the day, not the timestamp.
    expect(screen.getByText("2026-11-18")).toBeInTheDocument();
  });

  it("links a derived row to the report with its full detail, and dates every row", async () => {
    await loaded();
    const table = within(screen.getByRole("table"));
    expect(table.getByRole("link", { name: "Stale dates" })).toHaveAttribute("href", "/reports/stale-dates");
    expect(table.getByRole("link", { name: "Atlas vs chain" })).toHaveAttribute("href", "/reports/pau-audit");
    expect(table.getByText("found 2026-11-18")).toBeInTheDocument();
    expect(table.getByText("found 2026-10-30")).toBeInTheDocument();
  });

  it("filters by source through a URL-synced pill", async () => {
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: /^Stale dates/ }));
    expect(screen.getByText("1 of 3 candidates")).toBeInTheDocument();
    expect(window.location.search).toContain("src=stale-dates");
  });

  it("filters by when a candidate was first found", async () => {
    await loaded();
    const group = screen.getByText("First found:").parentElement!;
    fireEvent.click(within(group).getByRole("button", { name: /^last 7 days/ }));
    expect(screen.getByText("1 of 3 candidates")).toBeInTheDocument();
    expect(window.location.search).toContain("found=7");
    expect(within(screen.getByRole("table")).getByText("Sky Ecoystem")).toBeInTheDocument();
    fireEvent.click(within(group).getByRole("button", { name: /^last 30 days/ }));
    expect(screen.getByText("2 of 3 candidates")).toBeInTheDocument();
  });

  it("filters by when the document last changed", async () => {
    await loaded();
    const group = screen.getByText("Doc changed:").parentElement!;
    fireEvent.click(within(group).getByRole("button", { name: /^last 7 days/ }));
    expect(screen.getByText("1 of 3 candidates")).toBeInTheDocument();
    expect(window.location.search).toContain("changed=7");
    expect(within(screen.getByRole("table")).getByText(/March 5, 2026 as upcoming/)).toBeInTheDocument();
  });
});
