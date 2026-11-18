// Reads a ready preview bundle's artifacts for the chat/MCP preview tools. The
// caller has already opened the bundle through tool-access.ts — nothing here
// checks access, so never call it with a sha that did not come from there.

import fs from "node:fs";
import path from "node:path";
import type { AtlasNode } from "../../types.ts";
import { createCache } from "../ttl-cache.ts";
import type { DiffLine, WordSegment } from "../../lib/history";
import { trimContext } from "../../lib/diffCore.ts";
import { previewPaths } from "./cache.ts";
import type { PreviewDiffJson } from "./diff-artifacts.ts";
import { previewPatch, type BeforeEntry, type RemovedDoc } from "../../lib/previewPatch.ts";

export interface PreviewDocs {
  byId: Map<string, AtlasNode>;
  byDocNo: Map<string, AtlasNode>;
  children: Map<string, AtlasNode[]>;
}

// docs.json is the whole atlas (~7 MB), so keep only the last couple parsed:
// a review conversation asks about one preview several times in a row.
const DOCS_CACHE_MAX = 2;
const docsCache = createCache<PreviewDocs>({ max: DOCS_CACHE_MAX, lru: true });

function readJson<T>(sha: string, name: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(previewPaths(sha).outDir, name), "utf8")) as T;
  } catch {
    return null;
  }
}

export function loadPreviewDocs(sha: string): PreviewDocs {
  const hit = docsCache.get(sha);
  if (hit) return hit;
  const nodes = Object.values(readJson<{ nodes: Record<string, AtlasNode> }>(sha, "docs.json")?.nodes ?? {});
  const docs: PreviewDocs = { byId: new Map(), byDocNo: new Map(), children: new Map() };
  for (const n of nodes) {
    docs.byId.set(n.id, n);
    docs.byDocNo.set(n.doc_no, n);
    if (!n.parentId) continue;
    const kids = docs.children.get(n.parentId) ?? [];
    kids.push(n);
    docs.children.set(n.parentId, kids);
  }
  for (const kids of docs.children.values()) kids.sort((a, b) => a.order - b.order);
  docsCache.set(sha, docs);
  return docs;
}

/** diff.json with the identity verdict by meaning (identity.json, written
 *  after the build) laid over it, as the reader lays it, so the tools and the
 *  reader mark and redline the same swaps. */
export function readPreviewDiff(sha: string): PreviewDiffJson | null {
  const diff = readJson<PreviewDiffJson>(sha, "diff.json");
  const verdict = diff && readJson<Partial<Pick<PreviewDiffJson, "identitySwap" | "formerUuid">>>(sha, "identity.json");
  if (!diff || !verdict) return diff;
  return { ...diff, identitySwap: verdict.identitySwap ?? diff.identitySwap, formerUuid: verdict.formerUuid ?? diff.formerUuid };
}

/** The old side of the auto diff: each changed document's base fields and each removed document. */
export interface PreviewOldSide {
  before: Record<string, BeforeEntry>;
  removed: Map<string, RemovedDoc>;
}

// before.json and removed.json can run to megabytes, and a review asks about
// one preview several times in a row: keep the last couple parsed, like docs.json.
const oldSideCache = createCache<PreviewOldSide>({ max: DOCS_CACHE_MAX, lru: true });

export function readPreviewOldSide(sha: string): PreviewOldSide {
  const hit = oldSideCache.get(sha);
  if (hit) return hit;
  const removed = readJson<RemovedDoc[]>(sha, "removed.json") ?? [];
  const old = { before: readJson<Record<string, BeforeEntry>>(sha, "before.json") ?? {}, removed: new Map(removed.map((d) => [d.id, d])) };
  oldSideCache.set(sha, old);
  return old;
}

/** One document's redline, built the way the reader builds it (src/lib/previewPatch.ts). */
export function previewPatchFor(
  id: string,
  kind: "added" | "changed" | "removed",
  diff: PreviewDiffJson,
  docs: PreviewDocs,
  old: PreviewOldSide,
): DiffLine[] {
  const { formerUuid, identitySwap } = diff;
  return previewPatch(id, kind, { formerUuid, identitySwap, before: old.before, doc: (d) => docs.byId.get(d), removed: (d) => old.removed.get(d) });
}

/** A patch as plain text lines a model reads: "+ added", "- removed", "…" for
 *  a run of unchanged lines between two changes (a patch carries the whole
 *  document; a model needs only what changed). An in-line edit is written as
 *  the whole old line then the whole new line: word-level markup splits values
 *  ("2,[-504-]{+693+}" reads as 504 → 693 when the value went 2,504 → 2,693),
 *  and a model quotes what it reads. Past `max` rendered lines, the rest is
 *  summarised as a count of the changed lines left out. */
export function renderPatch(lines: DiffLine[], max: number): string[] {
  // Changed lines only, "…" between separate changes (diffCore's trimContext with no context).
  const changes = trimContext(lines, 0);
  const out: string[] = [];
  for (let i = 0; i < changes.length; i++) {
    const l = changes[i];
    if (out.length >= max) {
      out.push(`… (${changedLines(changes.slice(i))} more lines)`);
      break;
    }
    if (l[0] === "…") out.push("…");
    else if (l[0] === "~") out.push(`- ${sideOf(l[1], "-")}`, `+ ${sideOf(l[1], "+")}`);
    else out.push(`${l[0]} ${l[1]}`);
  }
  return out;
}

const changedLines = (lines: DiffLine[]): number =>
  lines.reduce((n, l) => n + (l[0] === "~" ? 2 : l[0] === "+" || l[0] === "-" ? 1 : 0), 0);

/** One side of an in-line edit: the unchanged words plus that side's own. */
function sideOf(segments: WordSegment[], side: "-" | "+"): string {
  return segments.map(([op, t]) => (op === "=" || op === side ? t : "")).join("");
}

/** The reader URL that shows a preview's copy of a document — the citation
 *  form for proposed text (live text keeps `/atlas/<uuid>`). */
export const previewCite = (sha: string, id: string): string => `/preview/${sha}/atlas?id=${id}`;
