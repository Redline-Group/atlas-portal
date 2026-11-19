// The Postgres store, the public read and the entry point's pass runner against
// a recording fake of db.ts's `sql`: the statements they send and the guards
// inside them. Driver return types are not covered here; see CLAUDE.md.
import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { makeFakeSql } from "../briefings-sql-fake.ts";

const baseExports = { ...(await import("../db.ts")) };
const fake = makeFakeSql();
mock.module("../db.ts", () => ({ ...baseExports, sql: fake.sql }));

const { realStore } = await import("./store-pg.ts");
const { handleEditCandidates, readEditCandidates } = await import("./read.ts");
const { maybeBilled, realDeps, runEditCandidates, withLock } = await import("../sync-edit-candidates.ts");
const { candidateKey } = await import("./store.ts");
const { fakeDeps, fakeStore, node } = await import("./fake-store.ts");

// Later files in the process see the real module again.
afterAll(() => void mock.module("../db.ts", () => baseExports));
beforeEach(() => fake.reset());

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const row = (uuid: string | null, quote: string, over = {}) => ({
  uuid, docNo: "A.1", file: "", category: "typo", severity: "high", pass: "language", quote, issue: "i", fix: null, ...over,
});
const sent = (key: string) => fake.calls.filter((c) => c.text.includes(key));

describe("reads", () => {
  it("loadSnapshot maps atlas_doc_meta rows to nodes", async () => {
    fake.script("FROM sync_state", [{ atlas_sha: "abc" }]);
    fake.script("FROM atlas_doc_meta", [{ id: A, doc_no: "A.1", title: "T", type: "Core", depth: 1, parentId: null, content: "x", order: 0, contentHash: "h", addressRefs: [] }]);
    const snap = await realStore.loadSnapshot();
    expect(snap).toMatchObject({ atlasSha: "abc", docs: [{ id: A }] });
  });

  it("loadSeedHash, loadDocStates and loadSpend read their rows, with empty defaults", async () => {
    expect(await realStore.loadSeedHash()).toBeNull();
    expect(await realStore.loadSpend("2026-11")).toBe(0);
    fake.script("edit_candidates_seed_hash", [{ h: "h1" }]);
    fake.script("FROM edit_candidate_docs", [{ doc_id: A, digest: "d", source: "seed", failures: 0, failed_digest: null }]);
    fake.script("FROM edit_candidate_spend", [{ usd: "1.25" }]);
    expect(await realStore.loadSeedHash()).toBe("h1");
    expect((await realStore.loadDocStates()).get(A)).toMatchObject({ digest: "d", source: "seed" });
    expect(await realStore.loadSpend("2026-11")).toBe(1.25);
  });
});

describe("replace", () => {
  it("deletes the documents' rows, inserts the new ones and records each document as read, in one transaction", async () => {
    await realStore.replace([{ docId: A, digest: "d1" }], [row(A, "q1")], { source: "worker", model: "m" });
    expect(fake.state.begins).toBe(1);
    expect(sent("DELETE FROM edit_candidates WHERE doc_id = ANY")[0].params).toEqual([`{${A}}`]);
    expect(sent("DELETE FROM edit_candidates WHERE doc_id IS NULL")).toHaveLength(0);
    const insert = sent("INSERT INTO edit_candidates (")[0];
    expect(insert.text).toContain("$2::uuid");
    expect(insert.text).toContain("$14::date");
    expect(insert.text).toContain("ON CONFLICT (key) DO NOTHING");
    expect(insert.params.slice(0, 3)).toEqual([candidateKey(row(A, "q1")), A, "A.1"]);
    expect(insert.params.slice(11, 13)).toEqual(["worker", "m"]);
    expect(sent("INSERT INTO edit_candidate_docs")[0].params).toEqual([A, "d1", "worker"]);
    expect(sent("edit_candidates_seed_hash")).toHaveLength(0);
  });

  it("keeps a found-again candidate's first day and the document's source file", async () => {
    const again = row(A, "same text");
    fake.script("SELECT key, doc_id, file", [{ key: candidateKey(again), doc_id: A, file: "A.1 - Scope.md", seen: "2026-09-15" }]);
    await realStore.replace([{ docId: A, digest: "d2" }], [again, row(A, "new text")], { source: "worker", model: "m" });
    const p = sent("INSERT INTO edit_candidates (")[0].params;
    expect([p[3], p[13]]).toEqual(["A.1 - Scope.md", "2026-09-15"]);
    expect(p[17]).toBe("A.1 - Scope.md");
    expect(p[27]).toBe(new Date().toISOString().slice(0, 10));
  });

  it("a seed also replaces the rows that span documents and stores the files' hash", async () => {
    await realStore.replace([{ docId: A, digest: "d" }], [row(null, "spans", { firstSeen: "2026-09-16" })], { source: "seed", model: null, corpus: true, seedHash: "fh" });
    expect(sent("DELETE FROM edit_candidates WHERE doc_id IS NULL")).toHaveLength(1);
    expect(sent("INSERT INTO edit_candidates (")[0].params[13]).toBe("2026-09-16");
    expect(sent("SET edit_candidates_seed_hash")[0].params).toEqual(["fh"]);
  });
});

describe("other writes", () => {
  it("dropCandidatesOf, forgetDocs and deleteKeys send nothing for an empty list", async () => {
    await realStore.dropCandidatesOf([]);
    await realStore.forgetDocs([]);
    expect(await realStore.deleteKeys([])).toBe(0);
    expect(fake.calls).toHaveLength(0);
  });

  it("dropCandidatesOf and forgetDocs bind a uuid array literal", async () => {
    await realStore.dropCandidatesOf([A, B]);
    await realStore.forgetDocs([A]);
    expect(fake.calls.map((c) => c.params)).toEqual([[`{${A},${B}}`], [`{${A}}`]]);
    expect(fake.calls[1].text).toContain("DELETE FROM edit_candidate_docs");
  });

  it("deleteKeys reports how many rows went", async () => {
    fake.script("RETURNING key", [{ key: "k1" }]);
    expect(await realStore.deleteKeys(["k1", "k2"])).toBe(1);
    expect(fake.calls[0].params).toEqual(["{k1,k2}"]);
  });

  it("bumpFailures counts per version, and markCovered can hold back when a commit is recorded", async () => {
    await realStore.bumpFailures([{ docId: A, digest: "d" }, { docId: B, digest: "e" }]);
    expect(sent("failed_digest")).toHaveLength(2);
    expect(fake.calls[0].text).toContain("THEN edit_candidate_docs.failures + 1 ELSE 1 END");
    await realStore.markCovered("sha", "2026-11-19", true);
    await realStore.addSpend("2026-11", 0.12);
    expect(sent("edit_candidates_covered_sha =")[0].params).toEqual(["sha", "2026-11-19", true]);
    expect(sent("INSERT INTO edit_candidate_spend")[0].params).toEqual(["2026-11", 0.12]);
  });
});

describe("GET /api/edit-candidates", () => {
  const stored = { doc_id: A, doc_no: "A.2", file: "f.md", category: "typo", severity: "low", pass: "language", quote: "q", issue: "i", fix: null, detector: null, first_seen: "2026-11-01" };

  it("answers 503 until a document has been recorded as read", async () => {
    expect(await readEditCandidates(fake.sql)).toBeNull();
    expect((await handleEditCandidates()).status).toBe(503);
  });

  it("serves the covered commit and day with the candidates in report order", async () => {
    fake.script("FROM sync_state", [{ docs: 2, swept: "2026-11-18", sha: "abc" }]);
    fake.script("FROM edit_candidates", [stored, { ...stored, quote: "q2", severity: "high", detector: "template-divergence", doc_id: null }]);
    const res = await handleEditCandidates();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { findings: Array<Record<string, unknown>> } & Record<string, unknown>;
    expect(body).toMatchObject({ generatedAt: "2026-11-18", atlasSha: "abc", documentsScanned: 2 });
    expect(body.findings.map((f) => [f.id, f.severity, f.firstSeen, f.detector])).toEqual([
      ["A.2#typo", "high", "2026-11-01", "template-divergence"],
      ["A.2#typo-2", "low", "2026-11-01", undefined],
    ]);
  });

  it("answers 503 when the database fails", async () => {
    fake.script("FROM sync_state", new Error("db down"));
    expect((await handleEditCandidates()).status).toBe(503);
  });
});

describe("runEditCandidates", () => {
  it("skips an unsynced database, and otherwise runs seed, veto and sweep over the snapshot", async () => {
    const empty = fakeDeps(fakeStore([]), () => new Error("unused"));
    await runEditCandidates(empty);
    expect(empty.requests).toHaveLength(0);
    const store = fakeStore([node(A, "A.1", "some text")]);
    const deps = fakeDeps(store, () => ({ content: '{"findings":[]}', finishReason: "stop", cost: 0.01 }));
    await runEditCandidates(deps);
    expect(deps.requests).toHaveLength(1);
    expect(store.covered).toEqual({ sha: "sha", day: "2026-11-19" });
  });
});

describe("the entry point", () => {
  it("runs under the advisory lock and releases it", async () => {
    fake.script("pg_try_advisory_lock", [{ ok: true }]);
    let ran = 0;
    await withLock(async () => void ran++);
    expect(ran).toBe(1);
    expect(sent("pg_advisory_unlock")).toHaveLength(1);
    expect(fake.state.releases).toBe(1);
  });

  it("skips when another run holds the lock, and runs unlocked when the database cannot be asked", async () => {
    fake.script("pg_try_advisory_lock", [{ ok: false }]);
    let ran = 0;
    await withLock(async () => void ran++);
    expect(ran).toBe(0);
    expect(sent("pg_advisory_unlock")).toHaveLength(0);
    fake.reset();
    fake.state.reserveError = new Error("no connection");
    await withLock(async () => void ran++);
    expect(ran).toBe(1);
  });

  it("only a timeout or an unclassified error may have been charged", () => {
    expect(maybeBilled({ name: "APIConnectionTimeoutError" })).toBe(true);
    expect(maybeBilled({ name: "Error" })).toBe(true);
    expect(maybeBilled({ name: "APIError", status: 503 })).toBe(false);
    expect(maybeBilled({ name: "APIConnectionError" })).toBe(false);
  });

  it("reads its settings and the committed sweep", () => {
    const deps = realDeps();
    expect(deps).toMatchObject({ model: "google/gemini-4-carbon", perCycle: 150, monthlyUsd: 5, reserveUsd: 0.5 });
    expect(deps.deadlineAt).toBeGreaterThan(Date.now());
    expect(deps.now()).toBeGreaterThan(0);
    expect(deps.readSeed()?.artifact.length).toBeGreaterThan(1000);
  });
});
