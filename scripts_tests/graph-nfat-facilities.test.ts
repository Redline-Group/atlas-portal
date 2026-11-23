// NFAT Facility extraction (scripts/lib/graph-nfat-facilities.ts) on the
// document shape of a Sky Core Halo's "NFAT Facilities" section, and the halo
// params and discovery that read around it.
import { describe, it, expect, vi } from "vitest";
import { buildChildrenIndex } from "../scripts/lib/graph-instances.mjs";
import { approvedNfatFacilities, nfatFacilities } from "../scripts/lib/graph-nfat-facilities.ts";
import { skyCoreHaloParams } from "../scripts/lib/graph-halos.ts";

const FACILITY = "8c029467-3c5b-46ae-8a0a-39663427cf9f";
const PROXY = "0xBEE5C2E8436e9834e6890A528E5B294D93b2Eec7";
const RATE = "0x372d6D3f411039B2341203EAB3CCC89D799aC0AE";
const HOME = "0x02Cb9629B0806b11202C59433eCe4e664C521128";
const doc = (id: string, doc_no: string, title: string, content = "The documents herein specify it.", type = "Core") => ({ id, doc_no, title, content, type });

const F = "A.1.14.6.3.1.3.1.1.1";
const docs = [
  doc("halo", "A.1.14.6.3.1", "Test Halo"),
  doc("sub", "A.1.14.6.3.1.1", "Test Halo SubProxy Account", "The address of Test Halo's SubProxy Account on the Ethereum Mainnet is `0xF12Be1673758f8fBC275755401774Ec45C80c0F0`."),
  doc("sec", "A.1.14.6.3.1.3", "NFAT Facilities"),
  doc("active", "A.1.14.6.3.1.3.1", "Active NFAT Facilities"),
  doc("net", "A.1.14.6.3.1.3.1.1", "Ethereum Mainnet"),
  doc(FACILITY, F, "Test NFAT Facility"),
  doc("terms", `${F}.1`, "Parameters"),
  doc("term", `${F}.1.4`, "Term", "The term is one year."),
  doc("arch", `${F}.2`, "Technical Architecture"),
  doc("contract", `${F}.2.1`, "NFAT Facility Contract"),
  doc("addr", `${F}.2.1.1`, "NFAT Facility Contract Address", `The address of the Test NFAT Facility Contract on Ethereum Mainnet is \`${HOME}\`.`),
  doc("pau", `${F}.2.2`, "NFAT Facility Diamond PAU"),
  doc("addrs", `${F}.2.2.1`, "Contract Addresses", `The addresses are:\n\n- ALM Proxy: \`${PROXY}\`\n- \`RateLimits\`: \`${RATE}\``),
  doc("issue", `${F}.2.2.3`, "Issue Rate Limit", "The values for each phase are:\n\n| Phase | `maxAmount` | `slope` |\n| --- | --- | --- |\n| 1 | 5,000,000 USDS | 1,000,000 USDS per day |"),
  doc("relayer", `${F}.2.2.5`, "Test NFAT Facility Relayer Multisig", "The multisig is registered as an Actor."),
  doc("relayer-addr", `${F}.2.2.5.1`, "Address", "The address is `0xfc6C70F76143565989385aB6B7F5acFa351c04e5`."),
  doc("done", "A.1.14.6.3.1.3.2", "Completed NFAT Facilities"),
  doc("approved", "A.2.2.10.1.1.1.4.7.0.6.1", "List Of Approved NFAT Facilities", `| NFAT Facility | Halo Agent | Specification |\n|---|---|---|\n| Test NFAT Facility | Test Halo | [${F} - Test NFAT Facility](${FACILITY}) |`, "Active Data"),
];
const children = buildChildrenIndex(docs);

describe("NFAT Facilities", () => {
  it("reads a facility with its status, network, terms, contract and Diamond PAU", () => {
    const [f, ...rest] = nfatFacilities(docs[0], children, approvedNfatFacilities(docs));
    expect(rest).toEqual([]);
    expect(f).toMatchObject({ id: FACILITY, name: "Test NFAT Facility", status: "Active", network: "Ethereum Mainnet", approved: true });
    expect(f.terms).toEqual({ Term: ["The term is one year.", "term", `${F}.1.4`] });
    expect(Object.keys(f.contract)).toEqual(["NFAT Facility Contract Address"]);
  });

  it("reads every contract of a list that ticks only some of its labels", () => {
    const [f] = nfatFacilities(docs[0], children);
    expect(f.pau["Contract Addresses / ALM Proxy"]?.[0]).toBe(`\`${PROXY}\``);
    expect(f.pau["Contract Addresses / RateLimits"]?.[0]).toBe(`\`${RATE}\``);
    expect(f.pau["Issue Rate Limit"]?.[0]).toContain("| 1 | 5,000,000 USDS |");
  });

  it("lists the PAU's multisigs by document and keeps their rules out of its params", () => {
    const [f] = nfatFacilities(docs[0], children);
    expect(f.multisigs).toEqual([{ id: "relayer", name: "Test NFAT Facility Relayer Multisig" }]);
    expect(Object.keys(f.pau)).not.toContain("Address");
    expect(f.approved).toBe(false);
  });

  it("keeps the facilities out of the halo's own contract params", () => {
    expect(Object.keys(skyCoreHaloParams(docs[0], children))).toEqual(["SubProxy Account / Ethereum Mainnet"]);
  });

  it("warns when the section holds documents but no facility is read", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const renamed = docs.map((d) => (d.id === "terms" || d.id === "arch" ? { ...d, title: `Facility ${d.title}` } : d));
    expect(nfatFacilities(renamed[0], buildChildrenIndex(renamed))).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[drift] tripwire"));
    warn.mockRestore();
  });

  it("reads a facility listed straight under the section, with no status", () => {
    const flat = docs.filter((d) => !["active", "net"].includes(d.id)).map((d) => (d.id.startsWith("8c02") || d.doc_no.startsWith(`${F}.`) ? { ...d, doc_no: d.doc_no.replace(F, "A.1.14.6.3.1.3.9") } : d));
    const [f] = nfatFacilities(flat[0], buildChildrenIndex(flat));
    expect(f).toMatchObject({ id: FACILITY, status: null, network: null });
    expect(Object.keys(f.contract)).toEqual(["NFAT Facility Contract Address"]);
  });

  it("takes approved facilities from the specification column, not a linked Halo Agent", () => {
    const list = docs.at(-1)!;
    const linked = { ...list, content: list.content.replace("| Test Halo |", "| [Test Halo](59d23e0e-dcf8-4fdb-937a-678023849cf6) |") };
    expect([...approvedNfatFacilities([linked])]).toEqual([FACILITY]);
  });

  it("reads nothing for a halo with no NFAT Facilities section", () => {
    const bare = docs.slice(0, 2);
    expect(nfatFacilities(bare[0], buildChildrenIndex(bare))).toEqual([]);
  });
});
