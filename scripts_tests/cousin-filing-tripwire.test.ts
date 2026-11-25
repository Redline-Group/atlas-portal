// The cousin-filing tripwire must stay silent on today's two ICD shapes and fire
// on a regrouping the reader's cousin matching would not recognise.
import { describe, it, expect, vi, afterEach } from "vitest";
import { checkCousinFilingTripwire } from "../scripts/lib/cousin-filing-tripwire.ts";

const doc = (doc_no: string, title: string) => ({ id: doc_no, doc_no, title });
const run = (docs: ReturnType<typeof doc>[]) => checkCousinFilingTripwire(docs, new Map(docs.map((d) => [d.doc_no, d])));

const HEALTHY = [
  doc("A.6.1.1.1.2.6.1.3", "Active Instances"),
  doc("A.6.1.1.1.2.6.1.3.1", "Ethereum Mainnet Instances"),
  doc("A.6.1.1.1.2.6.1.3.1.3", "Morpho"),
  doc("A.6.1.1.1.2.6.1.3.1.3.1", "Morpho USDC Instance Configuration Document"),
  doc("A.6.1.1.4.2.5.1.2", "Active Instances"),
  doc("A.6.1.1.4.2.5.1.2.1", "CoW Swap Instance Configuration Document"),
];

afterEach(() => vi.restoreAllMocks());

describe("checkCousinFilingTripwire", () => {
  it("stays silent on venue-filed and directly filed ICDs", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(run(HEALTHY)).toBe(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("fires one stable [drift] line when ICDs move straight under a chain heading", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const regrouped = [...HEALTHY, doc("A.6.1.1.1.2.6.1.3.1.9", "Curve USDC Instance Configuration Document")];
    expect(run(regrouped)).toBe(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/\[drift\] tripwire: Prime Agent ICDs filed under an unrecognised heading shape/);
  });
});
