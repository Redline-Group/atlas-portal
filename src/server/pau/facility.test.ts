import { describe, expect, it } from "bun:test";
import { facilityContract } from "./facility.ts";
import type { ChainCall } from "./snapshot.ts";
import type { PauDeployment } from "../../lib/pauRegistry.ts";

const member = (role: "nfatFacility" | "almProxy", address: string) => ({ role, address, provenance: [{ source: "manual" as const }] });
const deployment = (members: PauDeployment["members"]): PauDeployment => ({ prime: "h", primeName: "Test Halo", chain: "ethereum", kind: "diamond", members });
const reader = (answers: Record<string, unknown>) => async (_chain: string, calls: ChainCall[]) => calls.map((c) => answers[c.functionName] ?? null);

describe("facilityContract", () => {
  const facility = member("nfatFacility", "0xfac");
  it("reads the facility's own state and whether the deployment's proxy is an operator", async () => {
    const d = deployment([member("almProxy", "0xbee5"), facility]);
    const c = await facilityContract(reader({ gem: "0xDC03", recipient: "0xBEE5", stopped: false, name: "Pilot Test Allocation", symbol: "$PTA", buds: 1n }), d, facility);
    expect(c).toEqual({ role: "nfatFacility", address: "0xfac", events: 0, historyComplete: true, facility: { gem: "0xdc03", recipient: "0xbee5", stopped: false, operator: true, name: "Pilot Test Allocation", symbol: "$PTA" } });
  });
  it("keeps a failed read null, and asks about no operator without a listed proxy", async () => {
    const c = await facilityContract(reader({ buds: 0n }), deployment([facility]), facility);
    expect(c.facility).toEqual({ gem: null, recipient: null, stopped: null, operator: null, name: null, symbol: null });
  });
});
