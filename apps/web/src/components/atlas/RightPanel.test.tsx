// @vitest-environment jsdom
// RightPanel is one scrolling column (notes / onchain / history / glossary)
// with jump pills. We assert the pill wiring (aria-current + onTabChange), that
// each section renders, and that an empty section is hidden (history never is). The history children fetch from the server, so they're
// stubbed — the live-vs-preview history split is an L3 concern.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { RightPanel } from "./RightPanel";
import { makeNode, makeEdgeResult, makeGlossaryEntry, makeAddressInfo, makeEdge } from "../../test/fixtures";
import { DataSourceContext } from "../../lib/dataSource";
import { AtlasActionsContext } from "./AtlasActionsContext";
import { makeAtlasActions } from "../../test/readerLinks";
import { docIdFromPath } from "../../lib/visitHistory";
import type { AtlasTab } from "../../lib/atlasTab";
import { buildVoteIndex } from "@/lib/votes/vote-index";

vi.mock("../history/NodeHistory", () => ({
  NodeHistory: () => <div data-testid="node-history" />,
}));
vi.mock("../history/PreviewHistory", () => ({
  PreviewHistory: () => <div data-testid="preview-history" />,
}));
// The vote record: one cast Executive Vote links doc "node-1".
let voteRecord: { index: unknown; overlay: null } = { index: null, overlay: null };
vi.mock("../../lib/votes", () => ({ loadVoteRecord: () => Promise.resolve(voteRecord), loadVoteIndex: () => Promise.resolve(voteRecord.index) }));
vi.mock("@/lib/balances", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  loadBalancesCached: () => new Promise(() => {}),
  peekCachedBalances: () => null,
}));

afterEach(() => {
  cleanup();
  voteRecord = { index: null, overlay: null };
});


// Renders the panel, inside the reader's actions context when `actions` is given
// (as AtlasView renders it), standalone otherwise.
function setup(overrides: Partial<Parameters<typeof RightPanel>[0]> = {}, actions?: ReturnType<typeof makeAtlasActions>) {
  const onTabChange = vi.fn();
  const onNavigate = vi.fn();
  const props = {
    id: "node-1",
    annotationDocs: [],
    linkedNodes: [],
    cousinDocs: [],
    targetAddresses: {},
    chainValues: {},
    graphEdges: makeEdgeResult(),
    glossaryTerms: [],
    onNavigate,
    tab: "notes" as AtlasTab,
    onTabChange,
    docs: { "node-1": makeNode({ id: "node-1", content: "No dates here." }) },
    ...overrides,
  };
  const panel = <RightPanel {...props} />;
  render(actions ? <AtlasActionsContext.Provider value={actions}>{panel}</AtlasActionsContext.Provider> : panel);
  return { onTabChange, onNavigate };
}

describe("RightPanel section pills", () => {
  it("marks the active section via aria-current, without tab roles", () => {
    setup({ tab: "glossary", linkedNodes: [makeNode()], glossaryTerms: [[makeGlossaryEntry({ term: "Accord" })]] });
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByRole("navigation", { name: "Panel sections" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /glossary/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /notes/ })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: /glossary/ })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("button", { name: /notes/ })).toHaveAttribute("data-state", "inactive");
  });

  it("calls onTabChange with the clicked section", () => {
    const { onTabChange } = setup({ tab: "notes", glossaryTerms: [[makeGlossaryEntry({ term: "Accord" })]] });
    fireEvent.click(screen.getByRole("button", { name: /glossary/ }));
    expect(onTabChange).toHaveBeenCalledWith("glossary");
    fireEvent.click(screen.getByRole("button", { name: /history/ }));
    expect(onTabChange).toHaveBeenCalledWith("history");
  });

  it("shows the annotation count badge when there are linked docs", () => {
    setup({ linkedNodes: [makeNode(), makeNode()] });
    expect(screen.getByText(/linked documents · 2/)).toBeInTheDocument();
  });

  it("counts cited-by and relations in the notes pill", () => {
    setup({
      graphEdges: makeEdgeResult({
        inbound: [makeEdge({ e: "cites", f: "citing-1", ft: "doc" })],
        outbound: [makeEdge({ e: "depends_on", f: "node-1", t: "other", tt: "doc" })],
      }),
    });
    // 1 cited-by + 1 relation → the notes pill badge reads "· 2"
    expect(screen.getByRole("button", { name: /notes.*2/ })).toBeInTheDocument();
  });

  // Element Annotations belong in the notes panel — they are the hardest
  // section to reach in the reader (the atlas emits the supporting `0`
  // directory after every real sibling), so they lead it.
  it("lists the doc's Element Annotations under an 'annotated by' heading", () => {
    setup({
      annotationDocs: [
        makeNode({ id: "a1", doc_no: "A.2.8.0.3.1", type: "Annotation", title: "Business Activities" }),
        makeNode({ id: "a2", doc_no: "A.2.8.0.3.2", type: "Annotation", title: "Ecosystem" }),
      ],
    });
    expect(screen.getByText(/annotated by · 2/)).toBeInTheDocument();
    expect(screen.getByText("Business Activities")).toBeInTheDocument();
    expect(screen.getByText("Ecosystem")).toBeInTheDocument();
  });

  it("omits the annotated-by section entirely when the doc has no annotations", () => {
    setup({ linkedNodes: [makeNode()] });
    expect(screen.queryByText(/annotated by/)).not.toBeInTheDocument();
  });

  it("labels equivalent cousin documents by agent", () => {
    setup({
      cousinDocs: [{ node: makeNode({ title: "Grove Agent Artifact" }), agent: "Grove" }],
    });
    expect(screen.getByText(/cousin documents · 1/)).toBeInTheDocument();
    // Agent shown as the reader's agent pill (just the name), not "<name> agent".
    const pill = screen.getByText("Grove");
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveClass("atlas-agent-pill");
  });
});

describe("RightPanel section visibility", () => {
  it("shows only history when the doc has no notes, addresses or glossary terms", () => {
    setup();
    const pills = within(screen.getByRole("navigation", { name: "Panel sections" })).getAllByRole("button");
    expect(pills.map((b) => b.textContent)).toEqual(["history"]);
    expect(screen.queryByTestId("notes-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("onchain-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("glossary-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("history-panel")).toBeInTheDocument();
  });

  it("lists shown sections in pill order: history, notes, onchain, glossary", () => {
    setup({
      linkedNodes: [makeNode()],
      targetAddresses: { "0xabc": makeAddressInfo() },
      glossaryTerms: [[makeGlossaryEntry()]],
    });
    const pills = within(screen.getByRole("navigation", { name: "Panel sections" })).getAllByRole("button");
    expect(pills.map((b) => b.textContent?.split("·")[0].trim())).toEqual(["history", "notes", "onchain", "glossary"]);
  });

  it("falls back to the first shown section when the requested one is hidden", () => {
    setup({ tab: "notes", targetAddresses: { "0xabc": makeAddressInfo() } });
    expect(screen.queryByRole("button", { name: /notes/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /history/ })).toHaveAttribute("aria-current", "true");
  });

  it("falls back to history when the requested section is hidden and nothing else shows", () => {
    setup({ tab: "glossary" });
    expect(screen.getByRole("button", { name: /history/ })).toHaveAttribute("aria-current", "true");
  });
});

describe("RightPanel tab content", () => {
  it("renders addresses in the onchain section, not in notes", () => {
    setup({
      tab: "onchain",
      linkedNodes: [makeNode()],
      targetAddresses: { "0xabc": makeAddressInfo({ label: "MCD_VAT" }) },
    });
    expect(within(screen.getByTestId("onchain-panel")).getByText(/addresses · 1/)).toBeInTheDocument();
    expect(within(screen.getByTestId("notes-panel")).queryByText(/addresses/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /onchain.*1/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /notes.*1/ })).toBeInTheDocument();
  });

  it("groups glossary terms on the glossary tab", () => {
    setup({ tab: "glossary", glossaryTerms: [[makeGlossaryEntry({ term: "Accord" })]] });
    expect(screen.getByRole("link", { name: "Accord" })).toBeInTheDocument();
  });

  it("renders live NodeHistory on the history tab when not in preview", () => {
    setup({ tab: "history" });
    expect(screen.getByTestId("node-history")).toBeInTheDocument();
  });

  it("renders PreviewHistory on the history tab when in preview mode", () => {
    const onTabChange = vi.fn();
    render(
      <DataSourceContext.Provider value={{ base: "/api/preview/abc/", preview: { id: "abc", sha: "abc123" } }}>
        <RightPanel
          id="node-1"
          annotationDocs={[]}
          linkedNodes={[]}
          cousinDocs={[]}
          targetAddresses={{}}
          chainValues={{}}
          graphEdges={makeEdgeResult()}
          glossaryTerms={[]}
          onNavigate={vi.fn()}
          tab="history"
          onTabChange={onTabChange}
          docs={{}}
        />
      </DataSourceContext.Provider>,
    );
    expect(screen.getByTestId("preview-history")).toBeInTheDocument();
    expect(screen.queryByTestId("node-history")).not.toBeInTheDocument();
  });

  it("renders a selection checkbox on related cards when selectable", () => {
    const byParent = new Map<string | null, ReturnType<typeof makeNode>[]>();
    setup({
      linkedNodes: [makeNode({ title: "Selectable Node" })],
      selectable: true,
      byParent,
    });
    expect(screen.getByLabelText("Select Selectable Node")).toBeInTheDocument();
  });

  it("does not render a selection checkbox when selectable is false", () => {
    setup({ linkedNodes: [makeNode({ title: "Plain Node" })], selectable: false });
    expect(screen.queryByLabelText("Select Plain Node")).not.toBeInTheDocument();
  });
});

describe("RightPanel glossary grouping", () => {
  it("shows source-context links and content for multi-entry groups, and navigates on click", async () => {
    const user = userEvent.setup();
    const nodeId = "term-node";
    const { onNavigate } = setup({
      tab: "glossary",
      glossaryTerms: [
        [
          makeGlossaryEntry({
            term: "Accord",
            nodeId,
            content: "First definition.",
            sourceContext: "Article A",
          }),
          makeGlossaryEntry({
            term: "Accord",
            nodeId: "term-node-2",
            content: "Second definition.",
            sourceContext: "Article B",
          }),
        ],
      ],
    });
    expect(screen.getByText("Article A")).toBeInTheDocument();
    expect(screen.getByText("Article B")).toBeInTheDocument();
    expect(screen.getByText("First definition.")).toBeInTheDocument();
    expect(screen.getByText("Second definition.")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Accord" }));
    expect(onNavigate).toHaveBeenCalledWith(nodeId);

    await user.click(screen.getByText("Article B"));
    expect(onNavigate).toHaveBeenCalledWith("term-node-2");
  });

  it("omits the source-context link for a single-entry group", () => {
    setup({
      tab: "glossary",
      glossaryTerms: [[makeGlossaryEntry({ term: "Solo", sourceContext: "Should not show" })]],
    });
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
  });
});

describe("RightPanel graph relations", () => {
  it("renders cited-by entries and navigates on click", async () => {
    const user = userEvent.setup();
    const { onNavigate } = setup({
      tab: "notes",
      graphEdges: makeEdgeResult({
        inbound: [makeEdge({ e: "cites", f: "citer-1", s: ["A.9.9"] })],
      }),
    });
    expect(screen.getByText(/cited by · 1/)).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "A.9.9" }));
    expect(onNavigate).toHaveBeenCalledWith("citer-1");
  });

  // Every section filled, so a new kind of entry is covered without naming it:
  // each doc link opens the comparison pane on shift-click, and no button
  // navigates (a navigating button is how cited-by once missed the gesture).
  it("routes every doc link's shift-click to the comparison pane, and has no navigating buttons", () => {
    const actions = makeAtlasActions();
    const { onNavigate } = setup(
      {
        docNoToId: new Map([["A.2.2", "source-doc"]]),
        annotationDocs: [makeNode({ id: "annot-1", doc_no: "A.1.0.3.1", title: "Annotation Doc" })],
        linkedNodes: [makeNode({ id: "linked-1", title: "Linked Doc" })],
        cousinDocs: [{ node: makeNode({ id: "cousin-1", title: "Cousin Doc" }), agent: "Spark" }],
        glossaryTerms: [[
          makeGlossaryEntry({ term: "Accord", nodeId: "term-node", sourceContext: "Article A" }),
          makeGlossaryEntry({ term: "Accord", nodeId: "term-node-2", sourceContext: "Article B" }),
        ]],
        graphEdges: makeEdgeResult({
          inbound: [makeEdge({ e: "cites", f: "citer-1", s: ["A.9.9"] })],
          outbound: [makeEdge({ e: "depends_on", f: "node-1", t: "target-doc", tt: "doc", to_label: "Target Doc", s: ["A.2.2"] })],
        }),
      },
      actions,
    );
    const docLinks = screen.getAllByRole("link").filter((a) => docIdFromPath(a.getAttribute("href") ?? ""));
    const ids = docLinks.map((a) => docIdFromPath(a.getAttribute("href")!));
    expect(ids).toEqual(expect.arrayContaining(["annot-1", "linked-1", "cousin-1", "citer-1", "target-doc", "source-doc", "term-node", "term-node-2"]));
    for (const a of docLinks) fireEvent.click(a, { shiftKey: true });
    expect(actions.splitNavigate.mock.calls).toEqual(ids.map((id) => [id, "link"]));
    for (const b of screen.getAllByRole("button")) fireEvent.click(b);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("falls back to a truncated id when a cited-by edge has no source doc_no", async () => {
    setup({
      tab: "notes",
      graphEdges: makeEdgeResult({
        inbound: [makeEdge({ e: "cites", f: "12345678-abcd-ef00-1234-56789abcdef0", s: undefined })],
      }),
    });
    expect(screen.getByText("12345678")).toBeInTheDocument();
  });

  it("renders outbound relations with a navigable doc target, and an unmatched defining doc_no as text", async () => {
    const user = userEvent.setup();
    const { onNavigate } = setup({
      id: "self-id",
      tab: "notes",
      graphEdges: makeEdgeResult({
        outbound: [
          makeEdge({
            e: "depends_on",
            f: "self-id",
            t: "target-doc",
            tt: "doc",
            to_label: "Target Doc",
            s: ["A.2.2"],
          }),
        ],
      }),
    });
    expect(screen.getByText(/relations · 1/)).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Target Doc" }));
    expect(onNavigate).toHaveBeenCalledWith("target-doc");
    expect(screen.queryByRole("link", { name: "A.2.2" })).toBeNull();
    expect(screen.getByText("A.2.2")).toBeInTheDocument();
  });

  it("links a relation's defining doc_no once it resolves to a document", async () => {
    const user = userEvent.setup();
    const { onNavigate } = setup({
      docNoToId: new Map([["A.2.2", "source-doc"]]),
      graphEdges: makeEdgeResult({
        outbound: [makeEdge({ e: "depends_on", f: "node-1", t: "target-doc", tt: "doc", to_label: "Target Doc", s: ["A.2.2"] })],
      }),
    });
    await user.click(screen.getByRole("link", { name: "A.2.2" }));
    expect(onNavigate).toHaveBeenCalledWith("source-doc");
  });

  it("renders inbound entity relations as non-navigable labels with the inbound arrow", () => {
    setup({
      tab: "notes",
      graphEdges: makeEdgeResult({
        inbound: [
          makeEdge({
            e: "responsible_for",
            f: "entity-1",
            ft: "entity",
            t: "node-1",
            from_label: "Grove Facilitator",
            from_did: undefined,
          }),
        ],
      }),
    });
    expect(screen.getByText(/relations · 1/)).toBeInTheDocument();
    expect(screen.getByText("Grove Facilitator")).toBeInTheDocument();
    expect(screen.getByText("←")).toBeInTheDocument();
  });

  it("drops relations pointing back at the current node (self-nav) from rows and counts", () => {
    setup({
      id: "node-1",
      tab: "notes",
      graphEdges: makeEdgeResult({
        outbound: [
          makeEdge({ e: "depends_on", f: "node-1", t: "node-1", tt: "doc" }),
          makeEdge({ e: "depends_on", f: "node-1", t: "other", tt: "doc", to_label: "Other Doc" }),
        ],
      }),
    });
    expect(screen.getByText(/relations · 1/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /notes.*1/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Other Doc" })).toBeInTheDocument();
  });

  it("hides the notes section when its only relations are self-nav", () => {
    setup({
      id: "node-1",
      tab: "notes",
      graphEdges: makeEdgeResult({
        outbound: [makeEdge({ e: "depends_on", f: "node-1", t: "node-1", tt: "doc" })],
      }),
    });
    expect(screen.queryByTestId("notes-panel")).not.toBeInTheDocument();
    expect(screen.queryByText(/relations ·/)).not.toBeInTheDocument();
  });

  it("filters out HIDE-listed edge kinds from the relations section", () => {
    setup({
      tab: "notes",
      graphEdges: makeEdgeResult({
        outbound: [makeEdge({ e: "parent_of", f: "node-1", t: "child-1", tt: "doc" })],
      }),
    });
    expect(screen.queryByText(/relations ·/)).not.toBeInTheDocument();
  });
});

describe("RightPanel Executive Votes in the onchain section", () => {
  it("lists the Executive Votes behind the document under onchain, shown even without addresses", async () => {
    const link = [{ family: "atlas" as const, url: "", text: "", uuid: "node-1" }];
    voteRecord = {
      overlay: null,
      index: buildVoteIndex({
        sources: { executives: "", polls: "", portal: null },
        polls: [],
        executives: [{
          file: "2026/e.md", date: "2026-03-26", frontmatterDate: null, outOfSchedule: false, title: "Genesis Funding", summary: "",
          address: "0x24fdcd3bFA5C2553e05B2f9AD0365EBC296278D3",
          sections: [{ heading: "Transfers", text: "Transfer.", authorization: [], proposal: [], atlasRefs: link }],
          portal: { key: "k", date: "2026-03-26", active: false, hasBeenCast: true, datePassed: null, dateExecuted: null },
        }],
      }),
    };
    setup({ tab: "onchain" });
    const panel = await screen.findByTestId("onchain-panel");
    expect(within(panel).getByText("Executive Votes · 1")).toBeInTheDocument();
    expect(within(panel).queryByText(/addresses ·/)).not.toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "spell 0x24fd…78D3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /onchain.*1/ })).toBeInTheDocument();
  });

  it("hides onchain when there are neither addresses nor Executive Votes", async () => {
    setup();
    await screen.findByTestId("history-panel");
    expect(screen.queryByTestId("onchain-panel")).not.toBeInTheDocument();
  });
});

describe("RightPanel onchain order", () => {
  it("puts the Executive Votes above the addresses", async () => {
    voteRecord = {
      overlay: null,
      index: buildVoteIndex({
        sources: { executives: "", polls: "", portal: null },
        polls: [],
        executives: [{
          file: "2026/e.md", date: "2026-03-26", frontmatterDate: null, outOfSchedule: false, title: "Genesis Funding", summary: "", address: null,
          sections: [{ heading: "T", text: "T.", authorization: [], proposal: [], atlasRefs: [{ family: "atlas", url: "", text: "", uuid: "node-1" }] }],
          portal: null,
        }],
      }),
    };
    setup({ tab: "onchain", targetAddresses: { "0xabc": makeAddressInfo() } });
    const panel = await screen.findByTestId("onchain-panel");
    const votes = await within(panel).findByText("Executive Votes · 1");
    const addresses = within(panel).getByText(/addresses · 1/);
    expect(votes.compareDocumentPosition(addresses) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

