import { describe, expect, it, vi } from "vitest";
import type { AtlasNode } from "@/types";
import { docIdByDocNo, relationSourceDocs } from "./relationSources";

const doc = (id: string, doc_no: string) => ({ id, doc_no }) as AtlasNode;

describe("relationSourceDocs", () => {
  it("maps each source doc number to its document id, keeping unresolved ones as null", () => {
    const ids = docIdByDocNo({ a: doc("a", "A.1.2"), b: doc("b", "A.1.3") });
    expect(relationSourceDocs(["A.1.3", "A.9.9", "A.1.2"], () => ids)).toEqual([
      { docNo: "A.1.3", id: "b" },
      { docNo: "A.9.9", id: null },
      { docNo: "A.1.2", id: "a" },
    ]);
  });

  it("does not build the lookup for an edge with no source docs", () => {
    const build = vi.fn(() => new Map<string, string>());
    expect(relationSourceDocs(undefined, build)).toEqual([]);
    expect(relationSourceDocs([], build)).toEqual([]);
    expect(build).not.toHaveBeenCalled();
  });
});
