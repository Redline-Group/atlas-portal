import { describe, expect, test } from "bun:test";
import { liveView } from "./deps.ts";
import { digestOf, fakeDeps, fakeStore, node } from "./fake-store.ts";
import { seedApplies, seedPass, vetoPass } from "./seed.ts";
import { candidateKey, type DocState } from "./store.ts";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const a = node(A, "A.1", "text of a");
const b = node(B, "A.2", "text of b, edited since the file's sweep");
const row = (uuid: string | null, quote: string, extra: object = {}) => ({
  uuid, docNo: "A.1", file: "f.md", category: "typo", severity: "high", pass: "language", quote, issue: "i", fix: null, ...extra,
});
const state = (source: "seed" | "worker", digest: string): DocState => ({ digest, source, failures: 0, failed_digest: null });

function seedFiles(artifact: object, digests: Record<string, string>) {
  return () => ({ artifact: Buffer.from(JSON.stringify(artifact)), state: Buffer.from(JSON.stringify({ docs: digests })) });
}

describe("seedApplies", () => {
  test("the committed sweep speaks for a document until the worker has read a newer version", () => {
    expect(seedApplies(undefined, "old", "live")).toBe(true);
    expect(seedApplies(state("seed", "old"), "old", "live")).toBe(true);
    expect(seedApplies(state("worker", "live"), "old", "live")).toBe(false);
    expect(seedApplies(state("worker", "live"), "live", "live")).toBe(true);
  });
});

describe("seedPass", () => {
  const artifact = {
    generatedAt: "2026-11-18",
    atlasSha: "filesha",
    findings: [row(A, "text of a", { firstSeen: "2026-10-29" }), row(B, "text of b"), row(null, "spans documents")],
  };
  const digests = { [A]: digestOf(a), [B]: "digest-before-the-edit" };

  test("loads every document the file speaks for, with the file's dates", async () => {
    const store = fakeStore([a, b]);
    const deps = fakeDeps(store, () => new Error("no model in the seed"), { readSeed: seedFiles(artifact, digests) });
    expect(await seedPass(deps, liveView([a, b]))).toBe(2);
    expect([...store.rows.values()].map((r) => [r.uuid, r.firstSeen])).toEqual([[A, "2026-10-29"], [B, "2026-11-18"], [null, "2026-11-18"]]);
    expect(store.states.get(B)).toMatchObject({ digest: "digest-before-the-edit", source: "seed" });
    expect(store.replaces[0]).toMatchObject({ source: "seed", corpus: true });
    expect(store.covered).toEqual({ sha: "filesha", day: "2026-11-18" });
  });

  test("does not move coverage a sweep run has already recorded", async () => {
    const store = fakeStore([a, b]);
    store.covered = { sha: "later", day: "2026-11-19" };
    await seedPass(fakeDeps(store, () => new Error("unused"), { readSeed: seedFiles(artifact, digests) }), liveView([a, b]));
    expect(store.covered).toEqual({ sha: "later", day: "2026-11-19" });
  });

  test("leaves alone a document the worker has read at a newer version", async () => {
    const store = fakeStore([a, b]);
    store.states.set(B, state("worker", digestOf(b)));
    store.rows.set("w", { ...row(B, "edited since"), source: "worker" });
    const deps = fakeDeps(store, () => new Error("unused"), { readSeed: seedFiles(artifact, digests) });
    expect(await seedPass(deps, liveView([a, b]))).toBe(1);
    expect(store.rows.get("w")?.quote).toBe("edited since");
    expect([...store.rows.values()].some((r) => r.quote === "text of b")).toBe(false);
    expect(store.states.get(B)?.source).toBe("worker");
  });

  test("is skipped when the files are absent or unchanged", async () => {
    const store = fakeStore([a, b]);
    expect(await seedPass(fakeDeps(store, () => new Error("unused")), liveView([a, b]))).toBeNull();
    const deps = fakeDeps(store, () => new Error("unused"), { readSeed: seedFiles(artifact, digests) });
    await seedPass(deps, liveView([a, b]));
    expect(await seedPass(deps, liveView([a, b]))).toBeNull();
    expect(store.replaces).toHaveLength(1);
  });
});

describe("vetoPass", () => {
  test("removes stored rows a review rejected, except ones the file itself accepts", async () => {
    const store = fakeStore([a]);
    const [bad, kept, other] = [row(A, "vetoed"), row(A, "accepted after review"), row(A, "untouched")];
    for (const r of [bad, kept, other]) store.rows.set(candidateKey(r), { ...r, source: "worker" });
    const deps = fakeDeps(store, () => new Error("unused"), { readSeed: seedFiles({ generatedAt: "2026-11-18", findings: [kept], rejected: [bad, kept] }, {}) });
    const keys = await vetoPass(deps);
    expect([...store.rows.values()].map((r) => r.quote)).toEqual(["accepted after review", "untouched"]);
    expect(keys.has(candidateKey(bad))).toBe(true);
    expect(keys.has(candidateKey(kept))).toBe(false);
  });
});
