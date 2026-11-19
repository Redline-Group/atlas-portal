// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

Element.prototype.scrollIntoView = vi.fn();
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

import type { MistakesFile } from "@/lib/potentialMistakesIndex";
import type { AtlasNode } from "@/types";

const UUID_HERE = "11111111-1111-4111-8111-111111111111";
const UUID_MOVED = "22222222-2222-4222-8222-222222222222";
const UUID_GONE = "33333333-3333-4333-8333-333333333333";
const UUID_FIXED = "44444444-4444-4444-8444-444444444444";

const file: MistakesFile = {
  generatedAt: "2026-09-15",
  atlasSha: "d64eca4800553d21cf61cccba3c5f5a436edd256",
  documentsScanned: 11529,
  note: "",
  passes: { language: "", factual: "", deterministic: "" },
  findings: [
    {
      id: "a", docNo: "A.1.1", uuid: UUID_HERE, file: "A.1.md", category: "typo",
      severity: "high", pass: "language", quote: "Sky Ecoystem",
      issue: "Misspelling of Ecosystem.", fix: "Sky Ecosystem",
    },
    {
      id: "b", docNo: "A.2.8", uuid: UUID_MOVED, file: "A.2.md", category: "numeric",
      severity: "medium", pass: "factual", quote: "100,000,00 USDC",
      issue: "Malformed digit grouping.", fix: null,
    },
    {
      id: "c", docNo: "A.3.1", uuid: UUID_GONE, file: "A.3.md", category: "grammar",
      severity: "high", pass: "language", quote: "documents herein defines",
      issue: "Subject/verb disagreement.", fix: "define",
    },
    {
      id: "d", docNo: "A.1.2", uuid: UUID_FIXED, file: "A.1.md", category: "typo",
      severity: "high", pass: "language", quote: "Date Repository",
      issue: "Date for Data.", fix: "Data Repository",
    },
  ],
};

const doc = (id: string, doc_no: string, title: string, parentId: string | null = null, content = ""): AtlasNode =>
  ({ id, doc_no, title, type: "Core", depth: 3, parentId, content, order: 0, addressRefs: [] }) as AtlasNode;

// A.1.1 sits in the Governance Scope; the renumbered doc (A.2.8 at sweep time)
// now sits in Spark's artifact, whose operational executor is Amatsu.
vi.mock("../../lib/docs", () => ({
  loadDocs: () =>
    Promise.resolve({
      gov: doc("gov", "A.1", "The Governance Scope"),
      agents: doc("agents", "A.6", "The Agent Scope"),
      spark: doc("spark", "A.6.1.1.1", "Spark", "agents"),
      [UUID_HERE]: doc(UUID_HERE, "A.1.1", "Website And Domain", "gov", "The Sky Ecoystem site."),
      [UUID_MOVED]: doc(UUID_MOVED, "A.6.1.1.1.2", "Renamed Support Doc", "spark", "Cap: 100,000,00 USDC."),
      // Upstream fixed the typo the stored finding quotes.
      [UUID_FIXED]: doc(UUID_FIXED, "A.1.2", "Data Repository", "gov"),
    }),
}));
vi.mock("../../lib/graph", () => ({
  loadGraph: () =>
    Promise.resolve({
      participants: [
        { id: "e-spark", slug: "spark", name: "Spark", et: "agent", st: "prime", did: "spark" },
        { id: "e-amatsu", slug: "amatsu", name: "Amatsu", et: "agent", st: "operational_executor", did: "amatsu" },
      ],
      instances: [],
      invocations: [],
      primitives: [],
      edges: [{ f: "e-amatsu", ft: "entity", t: "e-spark", tt: "entity", e: "operational_executor_agent_for" }],
    }),
}));
vi.mock("../../lib/potentialMistakesLoad", () => ({
  loadPotentialMistakes: () => Promise.resolve(file),
}));
// The PAU API and the document history are down here: the text sweep still
// renders. EditCandidatesSources.test.tsx covers them answering.
vi.mock("../../lib/pau", () => ({ loadPau: () => Promise.resolve({ deployments: [] }) }));
vi.mock("../../lib/pauAudit", () => ({ loadPauAudit: () => Promise.resolve([]) }));
vi.mock("@/lib/history", () => ({ loadModCounts: () => Promise.resolve(null) }));

import { PotentialMistakesReport } from "./PotentialMistakesReport";

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
  Reflect.deleteProperty(window, "matchMedia");
  vi.restoreAllMocks();
});

describe("PotentialMistakesReport", () => {
  it("states that the candidates are AI-found, re-swept automatically, and not confirmed errors", async () => {
    render(<PotentialMistakesReport query="" mode="broad" />);
    expect(await screen.findByText(/Found by an AI sweep and automatic checks/)).toBeInTheDocument();
    expect(screen.getByText(/re-run automatically/)).toBeInTheDocument();
    expect(screen.getByText(/reads each new or changed document, and the documents that cite it/)).toBeInTheDocument();
    expect(screen.getByText(/a reviewer has ruled out stays off the list/)).toBeInTheDocument();
    // The atlas commit the sweep last covered is shown, short form.
    expect(screen.getByText("d64eca48")).toBeInTheDocument();
    expect(screen.getByText("2026-09-15")).toBeInTheDocument();
    // Same measure as the rest of the report chrome — not a narrower prose column.
    const banner = screen.getByText(/Found by an AI sweep/).closest("div");
    expect(banner).not.toHaveClass("max-w-[80ch]");
    expect(screen.getByRole("heading", { name: "Edit Candidates" }).parentElement).toHaveClass(
      "max-w-5xl",
    );
  });

  it("lists every source in the banner and names the one that is unavailable", async () => {
    render(<PotentialMistakesReport query="" mode="broad" />);
    await screen.findByText("Sky Ecoystem");
    const pau = (await screen.findByText("Atlas vs chain.")).closest("li")!;
    expect(pau).toHaveAttribute("data-state", "failed");
    expect(pau).toHaveTextContent(/Unavailable right now/);
    expect(screen.getByText("Text sweep.").closest("li")).toHaveAttribute("data-state", "ready");
    // No document history: the Doc changed pills are not offered.
    expect(screen.queryByText("Doc changed:")).not.toBeInTheDocument();
    expect(screen.getByText("First found:")).toBeInTheDocument();
  });

  it("renders every finding with its quoted atlas text and explanation", async () => {
    render(<PotentialMistakesReport query="" mode="broad" />);
    expect(await screen.findByText("Sky Ecoystem")).toBeInTheDocument();
    expect(screen.getByText("Misspelling of Ecosystem.")).toBeInTheDocument();
    expect(screen.getByText("100,000,00 USDC")).toBeInTheDocument();
    expect(screen.getByText("3 of 3 candidates")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(table.parentElement).toHaveClass("[max-width:calc(100vw-3rem)]");
    // Quote and issue share leftover width instead of flooring at 50ch each,
    // which used to force a horizontal scrollbar at the 48rem table breakpoint.
    expect(table).toHaveClass("table-fixed");
    expect(screen.getByRole("columnheader", { name: "Atlas text" })).toHaveClass("min-w-0");
    expect(screen.getByRole("columnheader", { name: "Why it is listed" })).toHaveClass("min-w-0");
    expect(screen.getByRole("columnheader", { name: "Atlas text" })).not.toHaveClass("min-w-[50ch]");
  });

  it("flags a finding whose document moved or vanished since the sweep", async () => {
    render(<PotentialMistakesReport query="" mode="broad" />);
    await screen.findByText("Sky Ecoystem");
    // Scoped to the table: the same labels also appear on the Doc status pills.
    const table = within(screen.getByRole("table"));
    // Renumbered rows name the doc's current number; missing rows say so.
    expect(table.getByText(/Renumbered since sweep/)).toBeInTheDocument();
    expect(table.getByText(/→ A.6.1.1.1.2/)).toBeInTheDocument();
    expect(table.getByText("Doc no longer in atlas")).toBeInTheDocument();
    // …and the banner totals them, so drift is visible without filtering.
    expect(screen.getByText(/renumbered or removed since it was swept/)).toBeInTheDocument();
  });

  it("hides a finding whose quote is gone from the atlas until its Doc status pill is picked", async () => {
    render(<PotentialMistakesReport query="" mode="broad" />);
    await screen.findByText("Sky Ecoystem");
    expect(screen.queryByText("Date Repository")).not.toBeInTheDocument();
    expect(screen.getByText(/hidden because the quoted text is no longer/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Quote no longer in doc/ }));
    expect(screen.getByText("1 of 4 candidates")).toBeInTheDocument();
    expect(screen.getByText("Date Repository")).toBeInTheDocument();
    expect(window.location.search).toContain("status=fixed");
  });

  it("marks a finding with no suggested edit as needing an author decision", async () => {
    render(<PotentialMistakesReport query="" mode="broad" />);
    expect(await screen.findByText("needs an author decision")).toBeInTheDocument();
  });

  it("filters rows by the header query and shows the no-rows line when nothing matches", async () => {
    const { rerender } = render(<PotentialMistakesReport query="" mode="broad" />);
    await screen.findByText("Sky Ecoystem");

    rerender(<PotentialMistakesReport query="Ecoystem" mode="broad" />);
    expect(screen.getByText("1 of 3 candidates")).toBeInTheDocument();
    expect(screen.queryByText("100,000,00 USDC")).not.toBeInTheDocument();

    rerender(<PotentialMistakesReport query="zzzznotfound" mode="broad" />);
    expect(screen.getByText("0 of 3 candidates")).toBeInTheDocument();
  });

  it("filters by confidence through a URL-synced pill", async () => {
    render(<PotentialMistakesReport query="" mode="broad" />);
    fireEvent.click(await screen.findByRole("button", { name: /^medium/ }));
    expect(screen.getByText("1 of 3 candidates")).toBeInTheDocument();
    expect(window.location.search).toContain("sev=medium");
  });

  it("filters by Atlas scope and by executor agent through URL-synced pills", async () => {
    render(<PotentialMistakesReport query="" mode="broad" />);
    fireEvent.click(await screen.findByRole("button", { name: /^A\.1 Governance/ }));
    expect(screen.getByText("1 of 3 candidates")).toBeInTheDocument();
    expect(window.location.search).toContain("scope=gov");
    fireEvent.click(screen.getByRole("button", { name: /^A\.1 Governance/ }));

    fireEvent.click(await screen.findByRole("button", { name: /^Amatsu/ }));
    expect(screen.getByText("1 of 3 candidates")).toBeInTheDocument();
    expect(window.location.search).toContain("exec=amatsu");
    expect(screen.getByText("100,000,00 USDC")).toBeInTheDocument();
    // The row names the artifact and the executor accountable for it.
    expect(within(screen.getByRole("table")).getByText("Spark · executor Amatsu")).toBeInTheDocument();
  });

  // The suggested fix only gets its own column on a wide screen (110rem).
  // Narrow (and jsdom, which has no matchMedia) keeps it under the explanation,
  // labelled — the label is what makes it readable there.
  describe("the suggested-fix column", () => {
    const matchMedia = (matches: (query: string) => boolean) =>
      vi.fn().mockImplementation((query: string) => ({
        matches: matches(query),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

    afterEach(() => {
      Reflect.deleteProperty(window, "matchMedia");
    });

    it("stays under the explanation, labelled, when the screen is too narrow", async () => {
      window.matchMedia = matchMedia(() => false) as unknown as typeof window.matchMedia;
      render(<PotentialMistakesReport query="" mode="broad" />);
      await screen.findByText("Sky Ecoystem");
      expect(screen.queryByText("Suggested")).not.toBeInTheDocument();
      expect(screen.getAllByText(/suggested:/).length).toBeGreaterThan(0);
    });

    it("becomes its own column on a wide screen, dropping the inline label", async () => {
      window.matchMedia = matchMedia((q) => q.includes("min-width: 110rem")) as unknown as typeof window.matchMedia;
      render(<PotentialMistakesReport query="" mode="broad" />);
      await screen.findByText("Sky Ecoystem");
      expect(screen.getByRole("columnheader", { name: "Suggested" })).toBeInTheDocument();
      expect(screen.queryAllByText(/suggested:/)).toHaveLength(0);
      // The fix text itself is still there — it moved, it did not vanish.
      expect(screen.getByText("Sky Ecosystem")).toBeInTheDocument();
    });
  });

  it("on a phone shows one stacked finding at a time, not the table", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width: 47.99rem"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    render(<PotentialMistakesReport query="" mode="broad" />);
    expect(await screen.findByText("Sky Ecoystem")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next candidate" })).toBeInTheDocument();
    // Doc numbers only — the atlas title is noise on a phone.
    expect(screen.getByText("A.1.1")).toBeInTheDocument();
    expect(screen.queryByText("Website And Domain")).not.toBeInTheDocument();
    // Category chips sit in a row, not one word per line.
    expect(screen.getByText("Typo / spelling").parentElement).toHaveClass("flex");
    // Filters start folded; the disclaimer is the bold lead-in plus an ellipsis.
    expect(screen.getByRole("button", { name: "Filters" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Confidence:")).not.toBeInTheDocument();
    const disclaimer = screen.getByRole("button", { name: /Found by an AI sweep/ });
    expect(disclaimer).toHaveAttribute("aria-expanded", "false");
    expect(disclaimer).toHaveTextContent("Found by an AI sweep and automatic checks — candidates, not confirmed errors.");
    expect(disclaimer).toHaveTextContent("…");
    expect(screen.getByText(/re-run automatically/).closest("[hidden]")).not.toBeNull();

    fireEvent.click(disclaimer);
    expect(disclaimer).toHaveAttribute("aria-expanded", "true");
    expect(disclaimer).not.toHaveTextContent("…");
    expect(screen.getByText(/re-run automatically/).closest("[hidden]")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByText("Confidence:")).toBeInTheDocument();
  });
});
