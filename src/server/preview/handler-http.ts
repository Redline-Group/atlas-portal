// Shared response plumbing for the /api/preview/* handlers.

import { json as httpJson, PREVIEW_CORS } from "../http.ts";

// noindex on every preview response: unreviewed (possibly fork) content must
// never be search-indexed under our domain (SEO-laundering defense). The
// default headers are PREVIEW_CORS (allow-origin + noindex), not http.ts’s
// wider `CORS` (the MCP preflight set).
// Shorthand over the shared helper (http.ts): every preview response
// carries the CORS+noindex pair unless a private bundle swaps in PRIVATE_HEADERS,
// so the header argument is positional here rather than an options object.
export function json(body: unknown, status: number, headers: Record<string, string> = PREVIEW_CORS): Response {
  return httpJson(body, status, { headers });
}
