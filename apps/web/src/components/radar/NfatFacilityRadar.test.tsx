// @vitest-environment jsdom
// NFAT Facilities on Radar: a Halo's facility cards, a subscribing instance's
// facility line, and a param stated as a table.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { NfatFacility } from "@/lib/nfatFacility";
import type { GraphEntity } from "@/types";

const FACILITY = "8c029467-3c5b-46ae-8a0a-39663427cf9f";
const CONTRACT_DOC = "f34d512c-f157-487f-b6cc-7ee8a5f49764";
const ADDRESS = "0x02Cb9629B0806b11202C59433eCe4e664C521128";
const facility: NfatFacility = {
  id: FACILITY, name: "Test NFAT Facility", doc_no: "A.1.14.6.3.1.3.1.1.1", status: "Active", network: "Ethereum Mainnet", approved: true,
  terms: { Term: ["The term is one year.", "t", "A.1"] },
  contract: {
    "NFAT Facility Contract Address": [`The address is \`${ADDRESS}\`.`, CONTRACT_DOC, "A.2"],
    "NFAT Identifiers / name": ["Pilot Test Allocation", "n", "A.3"],
    "NFAT Identifiers / symbol": ["$PTA", "n", "A.3"],
  },
  pau: { "Issue Rate Limit": ["Per phase:\n\n| Phase | `maxAmount` | `slope` |\n| --- | --- | --- |\n| 1 | 5,000,000 USDS | 1,000,000 USDS per day |\n| 2 | 5,000,000 USDS | 2,500,000 USDS per day |", "i", "A.4"] },
  multisigs: [{ id: "relayer-doc", name: "Test NFAT Facility Relayer Multisig" }],
};
const halo = { id: "h1", slug: "test-halo", name: "Test Halo", et: "agent", st: "halo", did: "h1", m: JSON.stringify({ params: {}, nfat_facilities: [facility] }) } as GraphEntity;
const osero = { id: "p1", slug: "osero", name: "Osero", et: "agent", st: "prime", did: "p1", m: "{}" } as GraphEntity;
const subscriber = { id: "inst", slug: "inst", name: "Ethereum Mainnet - Test NFAT Facility", et: "instance", st: "allocation-system", did: "inst", m: JSON.stringify({ agent_doc_id: "p1", params: { "NFAT Facility Address": [`See [A.2 - Address](${CONTRACT_DOC}).`, "x", "A.6"] } }) } as GraphEntity;

const pauState = vi.hoisted(() => ({ snaps: [] as unknown[] }));
vi.mock("../../lib/graph", () => ({ loadGraph: () => Promise.resolve({ participants: [halo, osero], instances: [subscriber], invocations: [], primitives: [], edges: [] }) }));
vi.mock("../../lib/pau", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/pau")>()),
  loadPau: () => Promise.resolve({ deployments: [] }),
  snapshotsForPrime: () => pauState.snaps,
}));

import { ActorNfatFacilities } from "./ActorNfatFacilities";
import { InstanceFacility } from "./InstanceFacility";
import { ParamValueLine } from "./ParamValueLine";

afterEach(() => {
  cleanup();
  pauState.snaps = [];
});

describe("ActorNfatFacilities", () => {
  it("shows each facility with its status, approval, subscribers, diagram and stated values", async () => {
    pauState.snaps = [{}];
    const { container } = render(<ActorNfatFacilities entity={halo} />);
    expect(screen.getByRole("heading", { name: "NFAT Facilities" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Test NFAT Facility" })).toHaveAttribute("href", expect.stringContaining(FACILITY));
    expect(screen.getByText("Active Facility")).toBeInTheDocument();
    expect(screen.getByText("on the approved list")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Osero" })).toHaveAttribute("href", expect.stringContaining("/radar/osero/primitives#"));
    expect(await screen.findByRole("link", { name: /What its contracts say on chain/ })).toHaveAttribute("href", "/radar/test-halo/pau");
    expect(container.querySelector('[data-node="facility"]')).toHaveTextContent("NFAT Facility Contract");
    for (const h of ["Deal terms", "NFAT Facility Contract", "Diamond PAU"]) expect(screen.getByRole("heading", { level: 4, name: h })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Test NFAT Facility Relayer Multisig" })).toBeInTheDocument();
  });

  it("says when no Prime subscribes and leaves the chain link out until the PAU is read", async () => {
    const lone = { ...halo, m: JSON.stringify({ nfat_facilities: [{ ...facility, approved: false, status: null, network: null, contract: {} }] }) } as GraphEntity;
    render(<ActorNfatFacilities entity={lone} />);
    expect(await screen.findByText(/No Prime Agent lists it as an instance yet/)).toBeInTheDocument();
    expect(screen.getByText("not on the approved list")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /What its contracts say on chain/ })).toBeNull();
  });

  it("renders nothing for an agent with no facilities", () => {
    const { container } = render(<ActorNfatFacilities entity={osero} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("InstanceFacility", () => {
  it("names the facility an instance links, its Halo, contract and NFAT", async () => {
    render(<InstanceFacility params={[{ key: "NFAT Facility Address", value: `See [A.2 - Address](${CONTRACT_DOC}).`, srcDocId: null }]} />);
    expect(await screen.findByRole("link", { name: "Test NFAT Facility" })).toHaveAttribute("href", `/radar/test-halo#facility-${FACILITY}`);
    expect(screen.getByText(/run by Test Halo/)).toHaveTextContent("NFAT Pilot Test Allocation ($PTA)");
  });

  it("renders nothing for an instance that links no facility", async () => {
    const { container } = render(<InstanceFacility params={[{ key: "Token", value: "USDS", srcDocId: null }]} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

describe("ParamValueLine with a table of several columns", () => {
  it("counts the rows by the first header and sets the table out", () => {
    render(<ParamValueLine p={{ key: "Issue Rate Limit", value: facility.pau["Issue Rate Limit"][0], srcDocId: null }} colWidth={100} instanceHint="x" />);
    expect(screen.getByText("2 phases")).toHaveAttribute("title", "Per phase:");
    expect(screen.getByRole("columnheader", { name: "maxAmount" })).toBeInTheDocument();
    expect(screen.getAllByRole("cell", { name: "5,000,000 USDS" })).toHaveLength(2);
  });

  it("counts rows when the first header is not a plain word that takes an s", () => {
    render(<ParamValueLine p={{ key: "Holders", value: "| Entity | Role | Since |\n| --- | --- | --- |\n| A | x | 1 |", srcDocId: null }} colWidth={100} instanceHint="x" />);
    expect(screen.getByText("1 row")).toBeInTheDocument();
  });
});
