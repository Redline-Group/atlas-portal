import { describe, it, expect } from "vitest";
import {
  REPORT_GROUPS,
  REPORT_SOURCES,
  REPORT_INDEX_CARDS,
  REPORT_INDEX_GROUPS,
  buildReportCatalog,
  catalogReportIds,
  reportEmbedText,
  reportEmbedFields,
} from "./reportCatalog";
import { SOURCE_CLASS_IDS } from "./provenance/sources";
import { REPORT_TITLES, REPORT_DESCRIPTIONS } from "./routes";

describe("catalog completeness", () => {
  // A report whose group key matches no section would ship unreachable from /reports.
  it("places every known report in exactly one group", () => {
    const ids = catalogReportIds();
    const known = Object.keys(REPORT_TITLES).sort();
    expect([...ids].sort()).toEqual(known);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("declares a source set for every grouped report, each class a known one", () => {
    for (const id of catalogReportIds()) {
      expect(Array.isArray(REPORT_SOURCES[id])).toBe(true);
      for (const s of REPORT_SOURCES[id]) expect(SOURCE_CLASS_IDS).toContain(s);
    }
  });

  it("stamps each card with its report's sources", () => {
    for (const card of REPORT_INDEX_CARDS) expect(card.sources).toEqual(REPORT_SOURCES[card.id]);
  });

  it("has a title and a hint on every group", () => {
    for (const g of REPORT_GROUPS) {
      expect(g.title).toBeTruthy();
      expect(g.hint).toBeTruthy();
      expect(g.reports.length).toBeGreaterThan(0);
    }
  });

  it("carries the shared title and description onto each card", () => {
    const card = buildReportCatalog().flatMap((g) => g.cards).find((c) => c.id === "rewards");
    expect(card?.title).toBe(REPORT_TITLES.rewards);
    expect(card?.description).toBe(REPORT_DESCRIPTIONS.rewards);
  });

  it("stamps each card with its group title as category", () => {
    for (const group of REPORT_INDEX_GROUPS) {
      expect(group.cards.length).toBeGreaterThan(0);
      for (const card of group.cards) {
        expect(card.category).toBe(group.title);
        expect(card.hint).toBe(group.hint);
        expect(card.title).toBe(REPORT_TITLES[card.id]);
        expect(card.description.length).toBeGreaterThan(20);
      }
    }
  });
});

describe("buildReportCatalog", () => {
  it("returns every group and card, unfiltered", () => {
    const groups = buildReportCatalog();
    expect(groups).toHaveLength(REPORT_GROUPS.length);
    expect(groups.flatMap((g) => g.cards)).toHaveLength(catalogReportIds().length);
    expect(REPORT_INDEX_GROUPS).toHaveLength(REPORT_GROUPS.length);
    expect(REPORT_INDEX_CARDS).toHaveLength(catalogReportIds().length);
  });
});

describe("report embed fields", () => {
  it("embed text is title plus description, not the shared group labels", () => {
    const card = REPORT_INDEX_CARDS[0]!;
    const text = reportEmbedText(card);
    expect(text).toContain(card.title);
    expect(text).toContain(card.description);
    expect(text).not.toContain(card.category);
    expect(reportEmbedFields(card)).toEqual([card.title, card.description, text]);
  });
});
