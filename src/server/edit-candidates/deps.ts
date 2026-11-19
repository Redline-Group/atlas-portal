// Injected dependencies of the edit-candidates passes, and the live view of the
// atlas they all read.
import { docDigest } from "../../../scripts/lib/mistakes-sweep.mjs";
import type { AtlasNode } from "../retrieval/indexes.ts";
import type { EditStore } from "./store.ts";

export interface ModelReply {
  content: string;
  finishReason: string | null;
  /** Dollars as the provider reported them, or null when it reported none. */
  cost: number | null;
}

/** The committed sweep: its findings and vetoes, and the digest of each document it read. */
export interface SeedFiles {
  artifact: Buffer;
  state: Buffer;
}

export interface EditDeps {
  runMigrations: () => Promise<string[]>;
  store: EditStore;
  /** The committed seed files' bytes, or null when either is absent. */
  readSeed: () => SeedFiles | null;
  complete: (system: string, user: string) => Promise<ModelReply>;
  model: string;
  /** Most documents read in one run. */
  perCycle: number;
  /** Most dollars spent on the model in one calendar month. */
  monthlyUsd: number;
  /** What one request is assumed to cost before it is made, and charged when the provider reports no cost. */
  reserveUsd: number;
  hasApiKey: boolean;
  /** ATLAS_WORKER_NO_FETCH=1: local dev, which must not spend. */
  noFetch: boolean;
  /** Epoch ms after which no new model request starts. */
  deadlineAt: number;
  now: () => number;
}

type HashedNode = AtlasNode & { contentHash: string };

export interface Live {
  docs: HashedNode[];
  nodeMap: Record<string, HashedNode>;
  digest: Map<string, string>;
}

// A document with no parser hash cannot be digested, so it is left out.
export function liveView(all: AtlasNode[]): Live {
  const docs = all.filter((d): d is HashedNode => Boolean(d.contentHash));
  if (docs.length < all.length) console.warn(`sync:edit-candidates: ${all.length - docs.length} documents have no content hash; skipped`);
  return {
    docs,
    nodeMap: Object.fromEntries(docs.map((d) => [d.id, d])),
    digest: new Map(docs.map((d) => [d.id, docDigest(d)])),
  };
}
