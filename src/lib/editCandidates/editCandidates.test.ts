// The Edit Candidates sources as rows: stale claims and PAU audit rows mapped
// into candidates, every source joined to the served atlas, and the two
// recency windows.
import { describe, expect, it } from "vitest";
import type { AtlasNode } from "../../types";
import type { AuditRow } from "../pauAuditIndex";
import type { Mistake } from "../potentialMistakesIndex";
import { buildStaleDatesReport } from "../staleDates";
import { PAU_SOURCE, pauCandidates } from "./pauRows";
import { matchesRecency, recencyCounts, withinDays } from "./recency";
import { joinCandidates } from "./rows";
import { STALE_SOURCE, staleCandidates } from "./staleRows";
import type { CandidateSourceMeta } from "./types";

const doc = (id: string, doc_no: string, content: string): AtlasNode =>
  ({ id, doc_no, title: `Title ${doc_no}`, type: "Core", depth: 3, parentId: null, content, order: 0, addressRefs: [] }) as AtlasNode;

const DOCS = {
  past: doc("past", "A.1.1", "The change will be included in the March 5, 2026 Executive Vote."),
  future: doc("future", "A.1.2", "The change will be included in the March 5, 2031 Executive Vote."),
  limit: doc("limit", "A.6.1", "Inflow maxAmount: 5,000,000 USDC"),
};
const TODAY = "2026-11-19";
const SWEEP: CandidateSourceMeta = { id: "sweep", label: "Text sweep", hint: "", detailPath: "" };

const audit = (over: Partial<AuditRow>): AuditRow => ({
  item: "value:limit:maxAmount", group: "atlas", reason: "chain-newer", note: "The chain value was set after the atlas last wrote it, and they disagree.",
  primeId: "p", prime: "Spark", chain: "ethereum", kind: "monolithic", subject: "Instance X", label: "Inflow maxAmount", stated: "5,000,000 USDC",
  onchain: "7,000,000 USDC", docId: "limit", key: "0xk", contract: "0xc", chainSetAt: "2026-11-10", atlasChangedAt: "2026-04-01", step: null, routes: null,
  ...over,
});

const stale = () => staleCandidates(buildStaleDatesReport(DOCS, new Date(`${TODAY}T12:00:00Z`)));

describe("staleCandidates", () => {
  it("lists only claims whose date has passed, first found on that date", () => {
    const rows = stale();
    expect(rows.map((r) => [r.uuid, r.category, r.severity, r.pass, r.firstSeen])).toEqual([
      ["past", "stale", "high", "deterministic", "2026-03-05"],
    ]);
    expect(rows[0].quote).toContain("March 5, 2026");
    expect(rows[0].issue).toBe("The text phrases March 5, 2026 as upcoming, and that date passed 259 days ago.");
    expect(rows[0].fix).toBeNull();
  });
});

describe("pauCandidates", () => {
  it("maps a row to an Atlas-vs-chain candidate dated by the later move", () => {
    const [row] = pauCandidates([audit({})], DOCS);
    expect(row).toMatchObject({ uuid: "limit", docNo: "A.6.1", category: "onchain", severity: "high", pass: "deterministic", firstSeen: "2026-11-10" });
    expect(row.quote).toBe("Inflow maxAmount: 5,000,000 USDC");
    expect(row.issue).toBe("Spark · ethereum · Instance X — The chain value was set after the atlas last wrote it, and they disagree. On chain: 7,000,000 USDC.");
  });

  it("drops a row that cites no served document, and ranks by which side is likely to change", () => {
    const rows = pauCandidates(
      [audit({ docId: null }), audit({ docId: "gone" }), audit({ group: "spell", chainSetAt: "before 2026-01-01", atlasChangedAt: null })],
      DOCS,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].severity).toBe("low");
    // A "before <date>" bound is not a date the row was found on.
    expect(rows[0].firstSeen).toBeUndefined();
  });

  it("gives rows sharing an item distinct ids", () => {
    const ids = pauCandidates([audit({}), audit({ chain: "base" })], DOCS).map((r) => r.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("joinCandidates", () => {
  const sweepRow: Mistake = {
    id: "s1", docNo: "A.1.2", uuid: "future", file: "A.1.md", category: "typo", severity: "medium", pass: "language",
    quote: "a quote that is gone", issue: "x", fix: null, firstSeen: "2026-11-18",
  };
  const rows = joinCandidates(
    [
      { meta: SWEEP, findings: [sweepRow] },
      { meta: STALE_SOURCE, findings: stale() },
      { meta: PAU_SOURCE, findings: pauCandidates([audit({})], DOCS) },
    ],
    DOCS,
    undefined,
    new Map([["past", "2026-11-01"]]),
  );
  const by = (source: string) => rows.find((r) => r.source === source)!;

  it("stamps each row with its source, detail report, first-found date and the document's last change", () => {
    expect(by("stale-dates")).toMatchObject({ sourceLabel: "Stale dates", detailHref: "/reports/stale-dates", found: "2026-03-05", docChanged: "2026-11-01" });
    expect(by("pau-audit")).toMatchObject({ sourceLabel: "Atlas vs chain", detailHref: "/reports/pau-audit", found: "2026-11-10", docChanged: "" });
    expect(by("sweep")).toMatchObject({ sourceLabel: "Text sweep", detailHref: "", found: "2026-11-18" });
  });

  it("holds only the stored sweep rows to their quote", () => {
    expect(by("sweep").status).toBe("fixed");
    // The PAU row's text is a label, not a quote, and it is computed live.
    expect(by("pau-audit").status).toBe("current");
    expect(by("stale-dates").status).toBe("current");
  });

  it("sorts every source together, most confident first", () => {
    expect(rows.map((r) => r.severity)).toEqual(["high", "high", "medium"]);
  });

  it("filters by either recency window, leaving out rows with no date", () => {
    const pick = (found: "7" | "30" | "90" | null, changed: "7" | "30" | "90" | null) =>
      rows.filter((r) => matchesRecency(r, { found, changed }, TODAY)).map((r) => r.source).sort();
    expect(pick("7", null)).toEqual(["sweep"]);
    expect(pick("30", null)).toEqual(["pau-audit", "sweep"]);
    expect(pick(null, "30")).toEqual(["stale-dates"]);
    expect(pick("90", "30")).toEqual([]);
    expect(recencyCounts(rows, (r) => r.found, TODAY)).toEqual({ "7": 1, "30": 2, "90": 2 });
  });
});

describe("withinDays", () => {
  it("includes both ends of the window and nothing after today", () => {
    expect(withinDays("2026-11-12", TODAY, 7)).toBe(true);
    expect(withinDays("2026-11-11", TODAY, 7)).toBe(false);
    expect(withinDays(TODAY, TODAY, 7)).toBe(true);
    expect(withinDays("2026-11-20", TODAY, 7)).toBe(false);
    expect(withinDays("", TODAY, 90)).toBe(false);
  });
});
