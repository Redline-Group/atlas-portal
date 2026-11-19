// GitHub REST fetch helper shared by the App modules.

// Calls the AMBIENT global fetch (not a captured reference) so tests can
// swap globalThis.fetch. Wraps the network call: a thrown error (DNS, abort,
// TLS…) collapses to `null` here so every caller has one shape to handle,
// instead of a propagating exception each call site would need to catch
// itself.
function ghHeaders(token: string, extra: RequestInit["headers"]): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "redlens-preview",
    // An empty token means an unauthenticated call (public endpoints only,
    // e.g. the account-id lookup in github-app-install-url.ts); GitHub rejects a bare `Bearer `.
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...((extra ?? {}) as Record<string, string>),
  };
}

export async function ghFetch(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; json: any } | null> {
  try {
    const res = await fetch(url, { ...init, headers: ghHeaders(token, init?.headers) });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* non-JSON (e.g. 5xx html) — leave null */
    }
    return { ok: res.ok, status: res.status, json };
  } catch {
    return null;
  }
}
