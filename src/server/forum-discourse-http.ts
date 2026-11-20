// JSON GET with retry for the Discourse client. `fetch` and `sleep` are
// injected so tests never hit the network or wait.

import { sleep as defaultSleep } from "./retry.ts";

export interface DiscourseFetch {
  (url: string, init?: RequestInit): Promise<Response>;
}

const UA = "redline-atlas-forum-sync";

/** Retry backoff: 500ms, then 1s. Injectable so tests never actually wait. */
const RETRY_BASE_MS = 500;

/**
 * Retry only what a second request could plausibly fix: 429 (we crawled too
 * fast) and 5xx (Discourse hiccup). Every other 4xx — a deleted, moved or
 * staff-only topic — is permanent, so retrying spends two more requests to
 * arrive at the same error.
 */
function retryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export interface GetJsonOpts {
  tries?: number;
  sleep?: (ms: number) => Promise<unknown>;
}

type Attempt = { ok: true; value: unknown } | { ok: false; error: Error };

/** One request. Returns a retryable failure; throws a permanent one. */
async function attemptJson(url: string, fetchImpl: DiscourseFetch): Promise<Attempt> {
  let res: Response;
  try {
    res = await fetchImpl(url, { headers: { accept: "application/json", "user-agent": UA } });
  } catch (e) {
    // Network-level failure (DNS, reset, timeout) — always worth retrying.
    return { ok: false, error: e as Error };
  }
  if (!res.ok) {
    const err = new Error(`GET ${url} → ${res.status}`);
    if (!retryableStatus(res.status)) throw err;
    return { ok: false, error: err };
  }
  try {
    return { ok: true, value: await res.json() };
  } catch (e) {
    return { ok: false, error: new Error(`GET ${url} → bad JSON: ${(e as Error).message}`) };
  }
}

export async function getJson(
  url: string,
  fetchImpl: DiscourseFetch,
  opts: GetJsonOpts = {},
): Promise<unknown> {
  const tries = opts.tries ?? 3;
  const sleep = opts.sleep ?? defaultSleep;
  let last: Error | null = null;
  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt > 0) await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    const result = await attemptJson(url, fetchImpl);
    if (result.ok) return result.value;
    last = result.error;
  }
  throw last ?? new Error(`GET ${url} failed`);
}
