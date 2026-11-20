// Shared response plumbing for the /api/preview/* handlers.

import { json as httpJson, PREVIEW_CORS } from "../http.ts";

export const SHA_RE = /^[0-9a-f]{40}$/i;
// noindex on every preview response: unreviewed (possibly fork) content must
// never be search-indexed under our domain (SEO-laundering defense). Defined
// in http.ts alongside the router's own header set — same home, distinct value:
// this `CORS` is PREVIEW_CORS (allow-origin + noindex), NOT http.ts's
// `CORS` (the wider MCP preflight set). Don't swap the import.
export const CORS = PREVIEW_CORS;

// Shorthand over the shared helper (http.ts): every preview response
// carries the CORS+noindex pair unless a private bundle swaps in PRIVATE_HEADERS,
// so the header argument is positional here rather than an options object.
export function json(body: unknown, status: number, headers: Record<string, string> = CORS): Response {
  return httpJson(body, status, { headers });
}
