// The store contract the edit-candidates passes are written against, so a test
// can stand in for the database. Its Postgres implementation is store-pg.ts.
import { createHash } from "node:crypto";
import type { AtlasNode } from "../retrieval/indexes.ts";

/** A candidate as the sweep and the seed write it. */
export interface CandidateWrite {
  uuid: string | null;
  docNo: string;
  file: string;
  category: string;
  severity: string;
  pass: string;
  quote: string;
  issue: string;
  fix: string | null;
  detector?: string | null;
  /** YYYY-MM-DD; absent means today, unless the same candidate is already stored. */
  firstSeen?: string;
}

export interface DocState {
  digest: string;
  source: "seed" | "worker";
  failures: number;
  failed_digest: string | null;
}

export interface SweptDoc {
  docId: string;
  digest: string;
}

export interface ReplaceBy {
  source: "seed" | "worker";
  model: string | null;
  /** Also replace the candidates that span documents. */
  corpus?: boolean;
  seedHash?: string;
}

export interface EditStore {
  loadSnapshot(): Promise<{ atlasSha: string | null; docs: AtlasNode[] }>;
  loadSeedHash(): Promise<string | null>;
  loadDocStates(): Promise<Map<string, DocState>>;
  /** Replaces the candidates of `docs` with `rows` and records each document as read. */
  replace(docs: SweptDoc[], rows: CandidateWrite[], by: ReplaceBy): Promise<void>;
  /** Removes the candidates of documents that are gone from the atlas. */
  dropCandidatesOf(docIds: string[]): Promise<void>;
  /** Forgets that these documents were ever read. */
  forgetDocs(docIds: string[]): Promise<void>;
  deleteKeys(keys: string[]): Promise<number>;
  bumpFailures(docs: SweptDoc[]): Promise<void>;
  loadSpend(month: string): Promise<number>;
  addSpend(month: string, usd: number): Promise<void>;
}

/** The identity of a candidate: this claim, about this text, in this document. */
export function candidateKey(c: { uuid: string | null; category: string; quote: string }): string {
  return createHash("sha256").update(`${c.uuid ?? ""}\u0000${c.category}\u0000${c.quote}`).digest("hex");
}
