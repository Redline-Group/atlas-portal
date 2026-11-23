import { describe, expect, it } from "vitest";
import { facilityIndex, facilitySubscribers, facilityValue, haloFacilities, linkedFacility } from "./nfatFacilities.ts";
import { nfatFacilityFacts } from "./nfatFacilityFacts.ts";
import type { NfatFacility } from "./nfatFacility.ts";
import type { PauSnapshot } from "./pau.ts";

const DOC = "f34d512c-f157-487f-b6cc-7ee8a5f49764";
const facility: NfatFacility = {
  id: "8c029467-3c5b-46ae-8a0a-39663427cf9f", name: "Test NFAT Facility", doc_no: "A.1.14.6.3.1.3.1.1.1", status: "Active", network: "Ethereum Mainnet", approved: true,
  terms: {}, pau: {}, multisigs: [],
  contract: { "NFAT Facility Contract Address": ["The address is `0x02Cb9629B0806b11202C59433eCe4e664C521128`.", DOC, "A.1"], "NFAT Identifiers / name": ["Pilot Test Allocation", "e4570241-cb6b-4224-acc0-5f65ab9c7386", "A.2"] },
};
const halo = { id: "h", slug: "test-halo", name: "Test Halo", st: "halo", m: JSON.stringify({ nfat_facilities: [facility] }) };
const instance = (id: string, value: string) => ({ id, name: id, m: JSON.stringify({ agent_doc_id: "prime-doc", params: { "NFAT Facility Address": [value, "x", "A.6"] } }) });

describe("NFAT facility lookups", () => {
  const index = facilityIndex([halo, { ...halo, id: "p", st: "prime" }]);
  it("reads facilities from a halo only", () => {
    expect(haloFacilities(halo)).toHaveLength(1);
    expect(haloFacilities({ st: "prime", m: halo.m })).toEqual([]);
  });
  it("finds the facility a param links a document of", () => {
    expect(linkedFacility([`specified in [A.1 - NFAT Facility Contract Address](${DOC}).`], index)?.halo.slug).toBe("test-halo");
    expect(linkedFacility(["specified in [A.9 - Other](00000000-0000-4000-8000-000000000000)."], index)).toBeNull();
  });
  it("lists the instances that subscribe to it", () => {
    const subs = facilitySubscribers([instance("a", `see [x](${DOC})`), instance("b", "USDS")], facility, index);
    expect(subs).toEqual([{ instanceId: "a", instanceName: "a", primeDocId: "prime-doc" }]);
  });
  it("reads a stated value by its key's ending", () => {
    expect(facilityValue(facility, "contract", "/ name")).toBe("Pilot Test Allocation");
    expect(facilityValue(facility, "contract", "/ symbol")).toBeNull();
  });
});

describe("nfatFacilityFacts", () => {
  const snap = (f: object): PauSnapshot => ({
    deployment: "d", prime: "h", primeName: "Test Halo", chain: "ethereum", kind: "diamond",
    contracts: [
      { role: "almProxy", address: "0xBEE5", events: 0, historyComplete: true },
      { role: "nfatFacility", address: "0x02cb", events: 0, historyComplete: true, facility: { gem: "0xdc03", name: "Pilot Test Allocation", symbol: "$PTA", recipient: null, stopped: null, operator: null, ...f } },
    ],
  });
  const fact = (s: PauSnapshot, label: string) => nfatFacilityFacts(s)!.find((x) => x.label === label)!;
  it("says a facility that is not wired yet is not, and warns", () => {
    const s = snap({ recipient: "0x0000000000000000000000000000000000000000", operator: false, stopped: false });
    expect(fact(s, "principal goes to")).toMatchObject({ value: "not set yet", warn: true });
    expect(fact(s, "ALM proxy")).toMatchObject({ value: "may not issue NFATs yet", warn: true });
    expect(fact(s, "status").value).toBe("running");
  });
  it("names the deployment's own proxy as the recipient, and flags any other", () => {
    expect(fact(snap({ recipient: "0xbee5" }), "principal goes to")).toEqual(expect.objectContaining({ value: "this PAU's ALM proxy" }));
    expect(fact(snap({ recipient: "0xabc" }), "principal goes to")).toMatchObject({ value: "0xabc", warn: true });
  });
  it("never reads a failed call as false", () => {
    const s = snap({});
    expect(fact(s, "ALM proxy").value).toBe("not read");
    expect(fact(s, "status").value).toBe("not read");
  });
  it("is absent for a deployment with no NFAT Facility", () => {
    expect(nfatFacilityFacts({ ...snap({}), contracts: [] })).toBeNull();
  });
});
