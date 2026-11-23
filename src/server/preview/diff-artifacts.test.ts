// Pure tests for computeDiffArtifacts/writeDiffArtifacts — no build, no
// subprocess, no network. Keyed on document identity (uuid) the way the real
// diff pipeline is: the head is compared against the merge base, and `live`
// drops what main already has.
import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { computeDiffArtifacts, writeDiffArtifacts } from "./diff-artifacts.ts";
import type { Snapshot, SnapshotDoc } from "./snapshot.ts";

function snap(docs: SnapshotDoc[]): Snapshot {
  return new Map(docs.map((d) => [d.id, d]));
}

const ID1 = "00000000-0000-4000-8000-000000000001";
const ID2 = "00000000-0000-4000-8000-000000000002";
const ID3 = "00000000-0000-4000-8000-000000000003";
const doc = (id: string, docNo: string, content: string, over: Partial<SnapshotDoc> = {}): SnapshotDoc => ({
  id,
  doc_no: docNo,
  title: "One",
  content,
  contentHash: `h:${content}`,
  ...over,
});

describe("computeDiffArtifacts: what counts as a change", () => {
  test("added doc: listed, with no old side", () => {
    const head = snap([doc(ID1, "A.1", "line one")]);
    const { diff, before, removed } = computeDiffArtifacts(snap([]), head);
    expect(diff.added).toEqual([ID1]);
    expect(diff.changed).toEqual([]);
    expect(before).toEqual({});
    expect(removed).toEqual([]);
  });

  test("lists the addresses a listed doc brings in, and not one the base names", () => {
    const known = "0x492aae70e59551768baf3c7159d3f951b6ed76fe";
    const fresh = "0xabcdef0000000000000000000000000000000001";
    const base = snap([doc(ID2, "A.2", `Known \`${known}\`.`)]);
    const head = snap([doc(ID1, "A.1", `Known \`${known}\`, fresh \`${fresh}\`.`)]);
    expect(computeDiffArtifacts(base, head).diff.introducedAddresses).toEqual([fresh]);
  });

  test("an edit main made after the fork is not the branch reverting it", () => {
    const base = snap([doc(ID1, "A.1", "fork-point text")]);
    const live = snap([doc(ID1, "A.1", "main's later text")]);
    const head = snap([doc(ID1, "A.1", "branch text")]);
    const { diff, before } = computeDiffArtifacts(base, head, live);
    expect(diff.changed).toEqual([ID1]);
    expect(before[ID1].content).toBe("fork-point text");
  });

  test("a renumbering main made after the fork is not reported on a doc the branch edited", () => {
    const base = snap([doc(ID1, "A.1", "old")]);
    const live = snap([doc(ID1, "A.9", "old")]);
    const head = snap([doc(ID1, "A.1", "new")]);
    expect(computeDiffArtifacts(base, head, live).diff.renumbered).toEqual({});
  });

  test("an edit main already has is not a change, and is listed as already on main", () => {
    const base = snap([doc(ID1, "A.1", "old"), doc(ID2, "A.2", "old")]);
    const live = snap([doc(ID1, "A.1", "new"), doc(ID2, "A.2", "old")]);
    const head = snap([doc(ID1, "A.1", "new"), doc(ID2, "A.2", "mine")]);
    const { diff } = computeDiffArtifacts(base, head, live);
    expect(diff.changed).toEqual([ID2]);
    expect(diff.alreadyOnMain).toEqual([ID1]);
  });

  test("flags listed docs main has also changed since the fork: edited, deleted, or added under the same UUID", () => {
    const ID4 = "00000000-0000-4000-8000-000000000004";
    const base = snap([doc(ID1, "A.1", "fork"), doc(ID2, "A.2", "fork"), doc(ID3, "A.3", "fork")]);
    const live = snap([doc(ID1, "A.1", "main moved on"), doc(ID3, "A.3", "fork"), doc(ID4, "A.4", "main's copy")]);
    const head = snap([doc(ID1, "A.1", "branch"), doc(ID2, "A.2", "branch"), doc(ID3, "A.3", "branch"), doc(ID4, "A.4", "branch's copy")]);
    const { diff } = computeDiffArtifacts(base, head, live);
    expect(diff.changed.sort()).toEqual([ID1, ID2, ID3].sort());
    // ID1 edited on main, ID2 deleted on main, ID4 added on main too; ID3 untouched on main.
    expect(diff.mainAlsoChanged!.sort()).toEqual([ID1, ID2, ID4].sort());
  });

  test("without live, nothing is flagged as also changed on main", () => {
    expect(computeDiffArtifacts(snap([doc(ID1, "A.1", "old")]), snap([doc(ID1, "A.1", "new")])).diff.mainAlsoChanged).toBeUndefined();
  });

  test("without live, nothing is listed as already on main", () => {
    expect(computeDiffArtifacts(snap([doc(ID1, "A.1", "old")]), snap([doc(ID1, "A.1", "new")])).diff.alreadyOnMain).toBeUndefined();
  });

  test("a doc main already added with the same UUID and text is not a change", () => {
    const live = snap([doc(ID1, "A.1", "same")]);
    const head = snap([doc(ID1, "A.1", "same")]);
    expect(computeDiffArtifacts(snap([]), head, live).diff.added).toEqual([]);
  });

  test("a removal main already made is not a change; one main still has is", () => {
    const base = snap([doc(ID1, "A.1", "a"), doc(ID2, "A.2", "b")]);
    const live = snap([doc(ID2, "A.2", "b")]);
    const { diff, removed } = computeDiffArtifacts(base, snap([]), live);
    expect(diff.removed).toEqual([ID2]);
    expect(removed.map((d) => d.id)).toEqual([ID2]);
  });

  test("without live, the merge base alone decides", () => {
    const base = snap([doc(ID1, "A.1", "old")]);
    const head = snap([doc(ID1, "A.1", "new")]);
    expect(computeDiffArtifacts(base, head).diff.changed).toEqual([ID1]);
  });

  test("raw-only edit: hash differs, text identical → changed, old side has no body", () => {
    const base = snap([doc(ID1, "A.1", "same", { contentHash: "raw-a" })]);
    const head = snap([doc(ID1, "A.1", "same", { contentHash: "raw-b" })]);
    const { diff, before } = computeDiffArtifacts(base, head);
    expect(diff.changed).toEqual([ID1]);
    expect(before[ID1]).toEqual({ doc_no: "A.1", title: "One", type: undefined });
  });
});

describe("computeDiffArtifacts: the old side and the heading flags", () => {
  test("renumber only: flagged, renumber-only, old side carries the heading fields but no body", () => {
    const base = snap([doc(ID1, "A.1", "same")]);
    const head = snap([doc(ID1, "A.9", "same")]);
    const { diff, before } = computeDiffArtifacts(base, head);
    expect(diff.renumbered).toEqual({ [ID1]: ["A.1", "A.9"] });
    expect(diff.renumberedOnly).toEqual([ID1]);
    expect(before[ID1]).toEqual({ doc_no: "A.1", title: "One", type: undefined });
  });

  test("title and type: flagged against the merge base", () => {
    const base = snap([doc(ID1, "A.1", "body", { title: "Old", type: "Core" })]);
    const head = snap([doc(ID1, "A.1", "body", { title: "New", type: "Section" })]);
    const { diff, before } = computeDiffArtifacts(base, head);
    expect(diff.retitled).toEqual({ [ID1]: ["Old", "New"] });
    expect(diff.retyped).toEqual({ [ID1]: ["Core", "Section"] });
    expect(diff.renumberedOnly).toEqual([]);
    expect(before[ID1]).toMatchObject({ title: "Old", type: "Core" });
  });

  test("a side with no type is never a type change", () => {
    const base = snap([doc(ID1, "A.1", "same")]);
    const head = snap([doc(ID1, "A.1", "same", { type: "Section" })]);
    const { diff } = computeDiffArtifacts(base, head);
    expect(diff.changed).toEqual([]);
    expect(diff.retyped).toEqual({});
  });

  test("reused slot: an added doc at a number another doc held on the merge base", () => {
    const base = snap([doc(ID1, "A.1", "old occupant", { title: "Old Doc" })]);
    const head = snap([doc(ID1, "A.2", "old occupant", { title: "Old Doc" }), doc(ID2, "A.1", "newcomer")]);
    const { diff } = computeDiffArtifacts(base, head);
    expect(diff.reusedSlot[ID2]).toEqual({ title: "Old Doc", movedTo: "A.2" });
  });

  test("unrelated docs stay out of the diff", () => {
    const base = snap([doc(ID2, "A.2", "two")]);
    const head = snap([doc(ID2, "A.2", "two"), doc(ID3, "A.3", "three")]);
    const { diff, before } = computeDiffArtifacts(base, head);
    expect(diff.added).toEqual([ID3]);
    expect(diff.changed).toEqual([]);
    expect(Object.keys(before)).toEqual([]);
  });
});

describe("writeDiffArtifacts", () => {
  const dirs: string[] = [];
  afterAll(() => {
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
  });

  test("writes diff, before and removed under the plain names, or a candidate's suffix", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "diff-artifacts-"));
    dirs.push(dir);
    const base = snap([doc(ID1, "A.1", "old"), doc(ID2, "A.2", "gone")]);
    const head = snap([doc(ID1, "A.1", "new")]);
    const result = computeDiffArtifacts(base, head);
    writeDiffArtifacts(dir, result);
    writeDiffArtifacts(dir, result, ".sky");
    for (const suffix of ["", ".sky"]) {
      const read = (name: string) => JSON.parse(fs.readFileSync(path.join(dir, `${name}${suffix}.json`), "utf8"));
      expect(read("diff")).toEqual(result.diff);
      expect(read("before")).toEqual(JSON.parse(JSON.stringify(result.before)));
      expect(read("removed")).toEqual(result.removed);
    }
    expect(result.before[ID1].content).toBe("old");
    expect(result.removed.map((d) => d.id)).toEqual([ID2]);
  });
});
