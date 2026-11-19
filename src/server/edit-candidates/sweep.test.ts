import { describe, expect, test } from "bun:test";
import { liveView } from "./deps.ts";
import { NOW, digestOf, fakeDeps, fakeStore, node } from "./fake-store.ts";
import { candidateKey } from "./store.ts";
import { MAX_FAILURES, monthOf, parseReply, sweepPass } from "./sweep.ts";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const docs = () => [node(A, "A.1", "pay at the proscribed rate"), node(B, "A.2", "a clean sentence")];
const MONTH = monthOf(NOW);
const ok = (findings: unknown[], cost: number | null = 0.1) => ({ content: JSON.stringify({ findings }), finishReason: "stop", cost });
const finding = (uuid: string, quote: string, category = "wrong-word") => ({ uuid, category, severity: "high", quote, issue: "wrong word", fix: null });

describe("parseReply", () => {
  test("reads the findings array, tolerating text around the object", () => {
    expect(parseReply('```json\n{"findings":[{"uuid":"x"}]}\n```', "stop")).toEqual([{ uuid: "x" }]);
  });
  test("a cut-off or malformed reply is null, not an empty list", () => {
    expect(parseReply('{"findings":[]}', "length")).toBeNull();
    expect(parseReply('{"findings":[', "stop")).toBeNull();
    expect(parseReply('{"rows":[]}', "stop")).toBeNull();
  });
});

describe("sweepPass", () => {
  test("is off without a model, a key, a budget, or under no-fetch", async () => {
    for (const over of [{ model: "" }, { hasApiKey: false }, { monthlyUsd: 0 }, { perCycle: 0 }, { noFetch: true }]) {
      const deps = fakeDeps(fakeStore(docs()), () => ok([]), over);
      expect(await sweepPass(deps, liveView(docs()), new Set())).toBeNull();
      expect(deps.requests).toHaveLength(0);
    }
  });

  test("keeps only verbatim, requested, unvetoed rows and records every document as read", async () => {
    const store = fakeStore(docs());
    const vetoed = new Set([candidateKey({ uuid: B, category: "grammar", quote: "a clean sentence" })]);
    const deps = fakeDeps(store, () =>
      ok([finding(A, "the proscribed rate"), finding(A, "not in the text"), finding("nope", "x"), finding(B, "a clean sentence", "grammar"), finding(A, "pay at", "colour")]),
    );
    expect(await sweepPass(deps, liveView(docs()), vetoed)).toEqual({ read: 2, found: 1 });
    expect([...store.rows.values()]).toMatchObject([{ uuid: A, quote: "the proscribed rate", pass: "language", fix: null, source: "worker" }]);
    expect(store.states.get(B)).toMatchObject({ digest: digestOf(docs()[1]), source: "worker" });
    expect(store.spend.get(MONTH)).toBe(0.1);
    expect(store.replaces[0]).toMatchObject({ source: "worker", model: "test/model" });
  });

  test("makes no request once the month's budget cannot cover the reserve", async () => {
    const store = fakeStore(docs());
    store.spend.set(MONTH, 4.6);
    const deps = fakeDeps(store, () => ok([]));
    expect(await sweepPass(deps, liveView(docs()), new Set())).toEqual({ read: 0, found: 0 });
    expect(deps.requests).toHaveLength(0);
    expect(store.states.size).toBe(0);
  });

  test("a failed or cut-off request charges the reserve, counts a failure and records nothing as read", async () => {
    for (const reply of [new Error("timeout"), { content: '{"findings":[', finishReason: "length", cost: null }]) {
      const store = fakeStore(docs());
      await sweepPass(fakeDeps(store, () => reply), liveView(docs()), new Set());
      expect(store.spend.get(MONTH)).toBe(0.5);
      expect(store.states.get(A)).toMatchObject({ digest: "", failures: 1 });
      expect(store.rows.size).toBe(0);
    }
  });

  test("a document that failed three times at its current version is parked", async () => {
    const store = fakeStore(docs());
    const [a, b] = docs();
    store.states.set(A, { digest: "", source: "worker", failures: MAX_FAILURES, failed_digest: digestOf(a) });
    const deps = fakeDeps(store, () => ok([]));
    await sweepPass(deps, liveView(docs()), new Set());
    expect(deps.requests).toHaveLength(1);
    expect(deps.requests[0]).toContain(b.id);
    expect(deps.requests[0].split("##### CONTEXT ONLY")[0]).not.toContain(a.id);
  });

  test("an unchanged document is not re-read, and a removed one loses its candidates and its record", async () => {
    const [a, b] = docs();
    const GONE = "00000000-0000-0000-0000-00000000000c";
    const store = fakeStore([a, b]);
    for (const d of [a, b]) store.states.set(d.id, { digest: digestOf(d), source: "seed", failures: 0, failed_digest: null });
    store.states.set(GONE, { digest: "old", source: "seed", failures: 0, failed_digest: null });
    store.rows.set("k", { uuid: GONE, docNo: "A.3", file: "", category: "typo", severity: "low", pass: "language", quote: "q", issue: "i", fix: null, source: "seed" });
    const deps = fakeDeps(store, () => ok([]));
    await sweepPass(deps, liveView([a, b]), new Set());
    expect(deps.requests).toHaveLength(0);
    expect(store.rows.size).toBe(0);
    expect(store.states.has(GONE)).toBe(false);
  });

  test("stops before a request once the deadline has passed", async () => {
    const deps = fakeDeps(fakeStore(docs()), () => ok([]), { deadlineAt: NOW - 1 });
    await sweepPass(deps, liveView(docs()), new Set());
    expect(deps.requests).toHaveLength(0);
  });
});
