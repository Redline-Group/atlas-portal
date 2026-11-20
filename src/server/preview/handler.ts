// HTTP surface for the preview feature, dispatched from index.ts's fetch
// fallback (dynamic :id/:sha segments + needs server.requestIP, so not the
// static routes object). Three endpoints under /api/preview/:
//   GET /:id/events           SSE build-status stream (drives the build)
//   GET /:sha/diff.json        added/changed doc ids vs current main
//   GET /:sha/commits          one doc's commit-by-commit history (SSE, commit-route.ts)
//   GET /:sha/<artifact>.json  allowlisted bundle artifact
//   GET /mine?shas=…&at=…      the caller's own previews: their account history
//                              plus the shas their browser remembers (with that
//                              browser's open time), private rows released only
//                              once access is authorized

// The handlers themselves: handler-events.ts (the stream) and handler-drive.ts
// (what it does), handler-artifacts.ts (diff.json and artifacts), handler-open.ts
// (what an open records), handler-http.ts (shared response plumbing).

import type { Server } from "bun";
import { parseLocalOpens, visiblePreviews } from "./mine.ts";
import { authorizePreviewAccess } from "./access.ts";
import { commitsResponse } from "./commit-route.ts";
import { PRIVATE_HEADERS } from "./sha-gate.ts";
import { getSessionUser } from "../session.ts";
import { mineRateLimited } from "./rate-limit.ts";
import { openAtlasPrs } from "./open-prs.ts";
import { SHA_RE } from "../../lib/patterns.ts";
import { json } from "./handler-http.ts";
import { eventsResponse } from "./handler-events.ts";
import { artifactResponse, diffResponse } from "./handler-artifacts.ts";

// Split-out modules, re-exported so existing importers keep one entry point.
export { resolveId, resolveCache, RESOLVE_CACHE_MAX } from "./resolve-id.ts";
export { rateLimited, ipHits, IP_LIMIT, mineRateLimited, mineHits, MINE_WINDOW_MS, MINE_LIMIT } from "./rate-limit.ts";

// GET /api/preview/mine?shas=<comma-separated 40-hex>&at=<epoch ms, aligned> —
// the /preview index's "my recent previews" list. What it collects, and what a
// visitor is allowed to see of it, lives in mine.ts; this is only the HTTP shell.
// Session-scoped, so PRIVATE_HEADERS (no allow-origin, no-store): never
// cacheable by a shared proxy.
async function minePreviews(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const local = parseLocalOpens(url.searchParams.get("shas"), url.searchParams.get("at"));
  const session = await getSessionUser(req).catch(() => null);
  if (local.length === 0 && !session) return json([], 200, PRIVATE_HEADERS);
  if (session && mineRateLimited(session.user.id)) {
    // 429 rather than an empty 200: the client must be able to tell "nothing to
    // show" from "ask again", and it leaves the list it already has on screen.
    return json({ error: "rate-limited" }, 429, { ...PRIVATE_HEADERS, "retry-after": "2" });
  }
  const browserAt = new Map(local.map((l) => [l.sha, l.at]));
  return json(
    await visiblePreviews(req, session?.user.id ?? null, local.map((l) => l.sha), authorizePreviewAccess, browserAt),
    200,
    PRIVATE_HEADERS,
  );
}

function eventsRoute(req: Request, server: Server<unknown>, id: string): Response {
  let decoded: string;
  try {
    decoded = decodeURIComponent(id);
  } catch {
    // Malformed percent-encoding (e.g. a lone "%E0%A4%A") — not a valid id.
    return json({ error: "not-found" }, 404);
  }
  const ip = server.requestIP(req)?.address ?? "unknown";
  return eventsResponse(req, decoded, ip);
}

/** Dispatch /api/preview/* . pathname includes the leading "/api/preview/". */
export function handlePreview(req: Request, server: Server<unknown>, pathname: string): Response | Promise<Response> {
  const rest = pathname.slice("/api/preview/".length);
  const segs = rest.split("/").filter(Boolean);
  // GET /api/preview/mine — the caller's OWN previews (private ones included,
  // each behind its repo's access check). There is deliberately no public
  // listing route: the one that existed ranked every preview anyone had opened,
  // and nothing consumed it once this one landed.
  if (segs.length === 1 && segs[0] === "mine") return minePreviews(req);
  // GET /api/preview/open-prs — open PRs against the canonical atlas, for the
  // /preview index "open atlas prs" tab.
  if (segs.length === 1 && segs[0] === "open-prs") {
    return openAtlasPrs()
      .then((prs) => json(prs, 200))
      .catch(() => json([], 200));
  }
  if (segs.length !== 2) return json({ error: "not-found" }, 404);
  const [a, b] = segs;

  if (b === "events") return eventsRoute(req, server, a);
  // artifact + diff endpoints are sha-keyed
  if (!SHA_RE.test(a)) return json({ error: "not-found" }, 404);
  if (b === "diff.json") return diffResponse(req, a.toLowerCase());
  if (b === "commits") return commitsResponse(req, a.toLowerCase(), server.requestIP(req)?.address ?? "unknown");
  return artifactResponse(req, a.toLowerCase(), b);
}
