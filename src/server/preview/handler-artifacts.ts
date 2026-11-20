// The sha-keyed GET endpoints of /api/preview/: diff.json and the allowlisted
// bundle artifacts. Routing is in handler.ts.

import fs from "node:fs";
import path from "node:path";
import { createCache } from "../ttl-cache.ts";
import { getIndexes } from "../retrieval/indexes.ts";
import { diffDocs } from "../atlas-refresh.ts";
import type { AtlasNode } from "../retrieval/indexes.ts";
import { previewPaths, artifactPath, touch } from "./cache.ts";
import { IDENTITY_FILES, isRefining } from "./identity-refine.ts";
import { PREVIEW_STORE, serveBundleArtifact } from "../bundle-store.ts";
import { getPreviewRow } from "./db.ts";
import { gateSha } from "./sha-gate.ts";
import { json } from "./handler-http.ts";

// Diff cache keyed by (preview sha, current main atlas sha).
// Exported for the eviction regression test only — not otherwise consumed
// outside this module.
export const DIFF_CACHE_MAX = 1000; // FIFO cap — matches the resolveCache pattern above
export const diffCache = createCache<{ added: string[]; changed: string[] }>({ max: DIFF_CACHE_MAX });

export async function diffResponse(req: Request, sha: string): Promise<Response> {
  const gated = await gateSha(req, sha);
  if ("deny" in gated) return gated.deny;
  const { headers } = gated;
  // Every built bundle ships an accurate diff.json — the `auto` diff-base pair
  // (the PR's own base, the fork's merge base, or live main when neither
  // candidate resolved — see build.ts's diff-artifacts block and
  // PreviewMeta.bases); serve it directly. diff.sky.json / diff.repo.json (the
  // other candidate pairs) are plain allowlisted artifacts, served by
  // artifactResponse below, not this endpoint. The vs-main hash diff below is
  // for cold-start builds and pre-change bundles that never got a diff.json written.
  const bundleDiff = path.join(previewPaths(sha).outDir, "diff.json");
  if (fs.existsSync(bundleDiff)) {
    return new Response(Bun.file(bundleDiff), { headers: { "Content-Type": "application/json", ...headers } });
  }
  const ix = getIndexes();
  if (ix.docMap.size === 0) return json({ error: "main-not-ready" }, 503, headers);
  const mainSha = ix.meta.atlasCommit ?? "unknown";
  const key = `${sha}:${mainSha}`;
  let diff = diffCache.get(key);
  if (!diff) {
    const previewNodes = Object.values(
      JSON.parse(fs.readFileSync(path.join(previewPaths(sha).outDir, "docs.json"), "utf8")).nodes,
    ) as AtlasNode[];
    const delta = diffDocs(ix.docMap, previewNodes);
    diff = { added: delta.added.map((n) => n.id), changed: delta.changed.map((n) => n.id) };
    // Skip caching when atlasCommit is unknown (main not yet loaded) — the key
    // would be "<sha>:unknown" and would serve a stale diff once main loads.
    if (mainSha !== "unknown") diffCache.set(key, diff);
  }
  return json(diff, 200, headers);
}

const isIdentityFile = (name: string) => (IDENTITY_FILES as readonly string[]).includes(name);

export async function artifactResponse(req: Request, sha: string, name: string): Promise<Response> {
  const gated = await gateSha(req, sha);
  if ("deny" in gated) return gated.deny;
  const { headers } = gated;
  // meta.json: overlay the live pr_state from the DB (the PR-state worker keeps
  // it current) so banners flip to merged/closed without a rebuild. Computed,
  // not served raw — handled here before the shared bundle reader.
  if (name === "meta.json") {
    const p = artifactPath(sha, name);
    if (!p || !fs.existsSync(p)) return json({ error: "not-found" }, 404, headers);
    touch(sha);
    const meta = JSON.parse(fs.readFileSync(p, "utf8"));
    const row = await getPreviewRow(sha).catch(() => null);
    if (row?.pr_state) meta.prState = row.pr_state;
    return json(meta, 200, headers);
  }
  // Plain artifacts go through the shared bundle reader (path + gzip + 404).
  const res = await serveBundleArtifact(PREVIEW_STORE, sha, name, req, headers);
  // identity*.json is written after the bundle is ready. While it is being
  // made the answer is "not yet", which the reader retries; a 404 is final.
  if (!res && isIdentityFile(name) && isRefining(sha)) return json({ status: "pending" }, 202, { ...headers, "Retry-After": "2" });
  if (!res) return json({ error: "not-found" }, 404, headers);
  touch(sha);
  return res;
}
