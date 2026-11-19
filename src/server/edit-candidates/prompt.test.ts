import { describe, expect, test } from "bun:test";
import { chunkMessage, neighbours, packChunks, pathOf, sweepIndex, type SweepDoc } from "./prompt.ts";

const UUID = (n: number): string => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const doc = (n: number, docNo: string, content = `body ${docNo}`): SweepDoc => ({ id: UUID(n), doc_no: docNo, title: `T ${docNo}`, type: "Core", content });

const root = doc(1, "A.1");
const parent = doc(2, "A.1.2");
const kids = [doc(3, "A.1.2.1"), doc(4, "A.1.2.2"), doc(5, "A.1.2.3"), doc(6, "A.1.2.4")];
const far = doc(7, "A.9", "far away");
const citing = doc(8, "A.1.2.5", `see [Far](${UUID(7)}) for the figure`);
const index = sweepIndex([root, parent, ...kids, citing, far]);

describe("placement", () => {
  test("pathOf lists ancestor titles outermost first, skipping numbers with no document", () => {
    expect(pathOf(kids[0], index)).toEqual(["T A.1", "T A.1.2"]);
    expect(pathOf(doc(9, "B.7.1"), index)).toEqual([]);
  });

  test("neighbours are the parent, then link targets, then siblings nearest first", () => {
    expect(neighbours(citing, index).map((d) => d.doc_no)).toEqual(["A.1.2", "A.9", "A.1.2.4", "A.1.2.3", "A.1.2.2", "A.1.2.1"]);
  });

  test("siblings are taken outward from the document's own position", () => {
    expect(neighbours(kids[1], index).map((d) => d.doc_no)).toEqual(["A.1.2", "A.1.2.3", "A.1.2.1", "A.1.2.4", "A.1.2.5"]);
  });

  test("neighbours stop at the per-document context budget, counting each at its clipped length", () => {
    const big = [1, 2, 3, 4, 5, 6].map((n) => doc(10 + n, `C.${n}`, "x".repeat(5_000)));
    expect(neighbours(big[0], sweepIndex(big))).toHaveLength(4);
  });
});

describe("chunks", () => {
  test("a queued document is never also context, and context is listed once", () => {
    const [chunk] = packChunks([kids[0], kids[1]], index);
    expect(chunk.docs).toEqual([kids[0], kids[1]]);
    expect(chunk.context).not.toContain(kids[0]);
    expect(chunk.context).not.toContain(kids[1]);
    expect(new Set(chunk.context).size).toBe(chunk.context.length);
  });

  test("a new chunk starts when the byte budget is reached", () => {
    const docs = [doc(20, "D.1", "a".repeat(700)), doc(21, "D.2", "b".repeat(700)), doc(22, "D.3", "c".repeat(700))];
    const chunks = packChunks(docs, sweepIndex(docs), 3_000);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.flatMap((c) => c.docs)).toEqual(docs);
  });

  test("the message carries the date, each document's header and the reason it is re-read", () => {
    const [chunk] = packChunks([citing], index);
    const text = chunkMessage(chunk, index, "2026-11-19", { [citing.id]: "Re-read because it links to: T A.9, which changed." });
    expect(text.startsWith("Today's date is 2026-11-19.")).toBe(true);
    expect(text).toContain(`=== UUID ${citing.id} | T A.1 > T A.1.2 > T A.1.2.5 [Core]\nRe-read because it links to: T A.9, which changed.\nsee [Far]`);
    expect(text.indexOf("##### CONTEXT ONLY")).toBeGreaterThan(text.indexOf(citing.id));
    expect(text.slice(text.indexOf("##### CONTEXT ONLY"))).toContain("far away");
  });

  test("a chunk with no neighbours has no context block, and long context is clipped", () => {
    const lone = doc(30, "Z", "alone");
    const [chunk] = packChunks([lone], sweepIndex([lone]));
    expect(chunkMessage(chunk, sweepIndex([lone]), "2026-11-19")).not.toContain("CONTEXT ONLY");
    const pair = [doc(31, "Y.1", "short"), doc(32, "Y.2", "w".repeat(3_000))];
    const ix = sweepIndex(pair);
    const text = chunkMessage(packChunks([pair[0]], ix)[0], ix, "2026-11-19");
    expect(text).toContain(`${"w".repeat(1_200)} […]`);
    expect(text).not.toContain("w".repeat(1_201));
  });
});
