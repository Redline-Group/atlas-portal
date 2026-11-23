// @vitest-environment jsdom
// The plumbing diagrams: a deployment draws its own generation's, and the change lanes follow the Prime's controllers.
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { CHANGE_PLUMBING, changePlumbings } from "@/lib/pauChangePaths";
import { SVM_CHANGE_PLUMBING } from "@/lib/pauChangePathsSvm";
import { NFAT_PLUMBING, PLUMBING, PLUMBING_NODE_H } from "@/lib/pauPlumbing";
import { PauNfatFacility } from "./PauNfatFacility";
import { PauChangePaths } from "./PauChangePaths";
import { PauPlumbing } from "./PauPlumbing";

afterEach(cleanup);

const anchor = { id: "ethereum", aliases: [] };
const own = (c: HTMLElement) => [...c.querySelectorAll("[data-own]")].map((g) => g.getAttribute("data-node"));

describe("PauPlumbing", () => {
  it("draws a monolithic deployment: each part, an arrow per rule, the optional one dashed", () => {
    const { container } = render(<PauPlumbing kind="monolithic" anchor={anchor} />);
    const p = PLUMBING.monolithic;
    for (const n of p.nodes) expect(container.querySelector(`[data-node="${n.id}"]`)).toHaveTextContent(n.name);
    expect(container.querySelectorAll("[data-edge]")).toHaveLength(p.edges.length);
    expect(container.querySelector('[data-edge="freezer-almProxy"] path')).toHaveAttribute("stroke-dasharray");
    expect(container.querySelector('[data-edge="controller-almProxy"] title')).toHaveTextContent("onlyRole(CONTROLLER) on doCall");
    expect(screen.getByRole("heading", { name: "How it fits together" })).toHaveAttribute("id", "ethereum-how-it-fits");
    expect(own(container)).toEqual([]);
  });
  it("draws a Diamond PAU and a Solana controller with the parts only they have", () => {
    const diamond = render(<PauPlumbing kind="diamond" anchor={anchor} />);
    expect(own(diamond.container)).toEqual(["agent", "accessControls", "facets"]);
    expect(diamond.container.querySelector('[data-edge="freezer-agent"]')).toHaveAttribute("data-kind", "stop");
    cleanup();
    const svm = render(<PauPlumbing kind="svm" anchor={{ id: "solana", aliases: [] }} />);
    expect(own(svm.container)).toEqual(["reserve", "permission", "integration"]);
    expect(svm.container.querySelector('[data-edge="freezer-program"] title')).toHaveTextContent("can_freeze_controller");
    expect(svm.container.querySelector('[data-node="almProxy"]')).toBeNull();
  });
  it("draws the NFAT Facility's money cycle and its facts only on a deployment that runs one", () => {
    const contract = (role: string, extra: object = {}) => ({ role, address: `0x${role}`, events: 0, historyComplete: true, ...extra });
    const facility = { gem: "0xdc03", gemSymbol: "USDS", recipient: "0x0000000000000000000000000000000000000000", stopped: false, operator: false, name: "Pilot Test Allocation", symbol: "$PTA" };
    const snap = { deployment: "d", prime: "h", primeName: "Test Halo", chain: "ethereum", kind: "diamond", fetchedAt: "2026-11-23T00:00:00Z", contracts: [contract("almProxy"), contract("nfatFacility", { facility })] };
    const { container } = render(<PauNfatFacility snap={snap as never} anchor={anchor} />);
    for (const n of NFAT_PLUMBING.nodes) expect(container.querySelector(`[data-node="${n.id}"]`)).toHaveTextContent(n.name);
    expect(container.querySelectorAll("[data-edge]")).toHaveLength(NFAT_PLUMBING.edges.length);
    expect(own(container)).toEqual(["facility"]);
    expect(screen.getByRole("heading", { name: "How the NFAT Facility works" })).toHaveAttribute("id", "ethereum-nfat-facility");
    expect(container.querySelector('[data-fact="principal goes to"]')).toHaveTextContent("not set yet");
    cleanup();
    expect(render(<PauNfatFacility snap={{ ...snap, contracts: [contract("almProxy")] } as never} anchor={anchor} />).container).toBeEmptyDOMElement();
  });
  it("names each drawing's arrowheads by its deployment, so two on a page do not share ids", () => {
    const { container } = render(<><PauPlumbing kind="monolithic" anchor={anchor} /><PauPlumbing kind="monolithic" anchor={{ id: "base", aliases: [] }} /></>);
    const ids = [...container.querySelectorAll("marker, title[id]")].map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("tags each part and arrow with its link token and scopes the hover rules to a deployment card", () => {
    const { container } = render(<PauPlumbing kind="monolithic" anchor={anchor} />);
    expect(container.querySelector('[data-node="relayer"]')).toHaveAttribute("data-fig", "n:relayer");
    expect(container.querySelector('[data-edge="controller-almProxy"]')).toHaveAttribute("data-fig", "e:controller-almProxy");
    expect(container.querySelector("style")?.textContent).toContain('.pau-deployment:has([data-fig~="n:relayer"]:hover) [data-link~="n:relayer"]');
  });
});

describe("PauChangePaths", () => {
  it("draws the EVM lanes for EVM controllers under an h3 of the change history", () => {
    const { container } = render(<PauChangePaths kinds={["monolithic", "diamond"]} />);
    expect([...container.querySelectorAll("[data-lane]")].map((g) => g.getAttribute("data-lane"))).toEqual(["By spell", "By spell", "Without a spell", "Emergency"]);
    for (const to of ["anything", "limits", "relayers"]) expect(container.querySelector(`[data-edge$="-${to}"]`)).not.toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: "How it changes" })).toHaveAttribute("id", "how-it-changes");
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  });
  it("adds the Solana lanes for a Prime that also runs a Solana controller, each titled", () => {
    const { container } = render(<PauChangePaths kinds={["monolithic", "svm"]} />);
    expect(screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent)).toEqual(["EVM chains", "Solana"]);
    expect(container.querySelector('[data-change-paths="pau-change-paths-svm"] [data-node="receiver"]')).toHaveTextContent("Governance program");
  });
  it("draws nothing for a Prime with no deployment read", () => {
    expect(changePlumbings([])).toEqual([]);
    expect(render(<PauChangePaths kinds={[]} />).container).toBeEmptyDOMElement();
  });
});

describe("plumbing data", () => {
  it.each(Object.entries({ ...PLUMBING, changes: CHANGE_PLUMBING, svmChanges: SVM_CHANGE_PLUMBING }))("%s joins only parts it draws, inside the view", (_kind, p) => {
    const ids = new Set(p.nodes.map((n) => n.id));
    for (const e of p.edges) expect(ids.has(e.from) && ids.has(e.to)).toBe(true);
    for (const n of p.nodes) expect(n.x + n.w <= p.w && n.y + (n.h ?? PLUMBING_NODE_H) <= p.h).toBe(true);
  });
});
