import { describe, expect, it } from "vitest";
import { SOURCE_CLASS_IDS } from "./sources";
import { SOURCE_SURFACES } from "./surfaces";

describe("source surfaces", () => {
  it("describes at least one surface for every class, with all four fields filled in", () => {
    for (const id of SOURCE_CLASS_IDS) {
      expect(SOURCE_SURFACES[id].length, id).toBeGreaterThan(0);
      for (const s of SOURCE_SURFACES[id]) {
        for (const field of [s.name, s.from, s.fresh, s.where]) expect(field.trim().length, `${id}: ${s.name}`).toBeGreaterThan(10);
      }
    }
  });

  it("names each surface once across all classes", () => {
    const names = SOURCE_CLASS_IDS.flatMap((id) => SOURCE_SURFACES[id].map((s) => s.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it("does not use the internal name in anything a reader sees", () => {
    const text = SOURCE_CLASS_IDS.flatMap((id) => SOURCE_SURFACES[id].flatMap((s) => [s.name, s.from, s.fresh, s.where])).join(" ");
    expect(text).not.toMatch(/SAbR|redlens/i);
  });
});
