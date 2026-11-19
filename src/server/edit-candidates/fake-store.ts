// An in-memory EditStore and dependency set for the edit-candidates tests.
import { docDigest } from "../../../scripts/lib/mistakes-sweep.mjs";
import type { AtlasNode } from "../retrieval/indexes.ts";
import type { EditDeps, ModelReply } from "./deps.ts";
import { candidateKey, type CandidateWrite, type DocState, type EditStore, type ReplaceBy } from "./store.ts";

export interface FakeStore extends EditStore {
  docs: AtlasNode[];
  states: Map<string, DocState>;
  rows: Map<string, CandidateWrite & { source: string }>;
  spend: Map<string, number>;
  seedHash: string | null;
  replaces: ReplaceBy[];
}

export function node(id: string, docNo: string, content: string, title = `Title ${docNo}`): AtlasNode {
  return { id, doc_no: docNo, title, type: "Core", depth: 1, parentId: null, content, order: 0, contentHash: `h:${content}`, addressRefs: [] } as AtlasNode;
}

export const digestOf = (n: AtlasNode): string => docDigest(n as AtlasNode & { contentHash: string });

export function fakeStore(docs: AtlasNode[]): FakeStore {
  const s: FakeStore = {
    docs, states: new Map(), rows: new Map(), spend: new Map(), seedHash: null, replaces: [],
    loadSnapshot: async () => ({ atlasSha: "sha", docs: s.docs }),
    loadSeedHash: async () => s.seedHash,
    loadDocStates: async () => new Map(s.states),
    async replace(read, rows, by) {
      s.replaces.push(by);
      const ids = new Set(read.map((d) => d.docId));
      for (const [k, r] of s.rows) if ((r.uuid && ids.has(r.uuid)) || (by.corpus && r.uuid === null)) s.rows.delete(k);
      for (const r of rows) s.rows.set(candidateKey(r), { ...r, source: by.source });
      for (const d of read) s.states.set(d.docId, { digest: d.digest, source: by.source, failures: 0, failed_digest: null });
      if (by.seedHash) s.seedHash = by.seedHash;
    },
    async dropCandidatesOf(ids) {
      for (const [k, r] of s.rows) if (r.uuid && ids.includes(r.uuid)) s.rows.delete(k);
    },
    async forgetDocs(ids) {
      for (const id of ids) s.states.delete(id);
    },
    async deleteKeys(keys) {
      return keys.filter((k) => s.rows.delete(k)).length;
    },
    async bumpFailures(read) {
      for (const d of read) {
        const have = s.states.get(d.docId);
        const failures = have?.failed_digest === d.digest ? have.failures + 1 : 1;
        s.states.set(d.docId, { digest: have?.digest ?? "", source: have?.source ?? "worker", failures, failed_digest: d.digest });
      }
    },
    loadSpend: async (month) => s.spend.get(month) ?? 0,
    async addSpend(month, usd) {
      s.spend.set(month, (s.spend.get(month) ?? 0) + usd);
    },
  };
  return s;
}

export const NOW = Date.UTC(2026, 10, 19, 12);

/** Dependencies over a fake store; `reply` answers every model request. */
export function fakeDeps(store: FakeStore, reply: (user: string) => ModelReply | Error, over: Partial<EditDeps> = {}): EditDeps & { requests: string[] } {
  const requests: string[] = [];
  return {
    requests,
    runMigrations: async () => [],
    store,
    readSeed: () => null,
    complete: async (_system, user) => {
      requests.push(user);
      const r = reply(user);
      if (r instanceof Error) throw r;
      return r;
    },
    model: "test/model",
    perCycle: 100,
    monthlyUsd: 5,
    reserveUsd: 0.5,
    hasApiKey: true,
    noFetch: false,
    deadlineAt: NOW + 60_000,
    now: () => NOW,
    ...over,
  };
}
