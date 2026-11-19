import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchJson = vi.fn();
vi.mock("@/lib/verify", () => ({
  fetchJson: (...a: unknown[]) => fetchJson(...a),
}));

import { loadPotentialMistakes, resetPotentialMistakesCache } from "./potentialMistakesLoad";

const file = (documentsScanned: number, findings: unknown = []) => ({ generatedAt: "2026-11-19", atlasSha: "abc", documentsScanned, note: "", passes: {}, findings });
const urls = () => fetchJson.mock.calls.map((c) => c[0] as string);

describe("loadPotentialMistakes", () => {
  beforeEach(() => {
    resetPotentialMistakesCache();
    fetchJson.mockReset();
  });

  it("serves the worker's rows from the API and fetches once", async () => {
    const live = file(12000);
    fetchJson.mockResolvedValue(live);
    await expect(loadPotentialMistakes()).resolves.toBe(live);
    await loadPotentialMistakes();
    expect(urls()).toEqual(["/api/edit-candidates"]);
  });

  it("falls back to the committed file when the API is unreachable", async () => {
    const seed = file(11000);
    fetchJson.mockRejectedValueOnce(new Error("edit-candidates: 404")).mockResolvedValueOnce(seed);
    await expect(loadPotentialMistakes()).resolves.toBe(seed);
    expect(urls()[1]).toMatch(/potential-mistakes\.json$/);
  });

  it("falls back when the worker has swept nothing or the answer has no rows", async () => {
    const seed = file(11000);
    fetchJson.mockResolvedValueOnce(file(0)).mockResolvedValueOnce(seed);
    await expect(loadPotentialMistakes()).resolves.toBe(seed);
    resetPotentialMistakesCache();
    fetchJson.mockResolvedValueOnce(file(5, null)).mockResolvedValueOnce(seed);
    await expect(loadPotentialMistakes()).resolves.toBe(seed);
  });

  it("rejects when both are down, and asks again next time", async () => {
    fetchJson.mockRejectedValue(new Error("down"));
    await expect(loadPotentialMistakes()).rejects.toThrow("down");
    fetchJson.mockReset();
    fetchJson.mockResolvedValue(file(3));
    await expect(loadPotentialMistakes()).resolves.toMatchObject({ documentsScanned: 3 });
  });
});
