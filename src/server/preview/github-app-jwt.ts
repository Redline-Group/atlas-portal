// The App's own credential and the fetch every GitHub App call goes through.
// The two credentials and the fail-closed rule are described in github-app.ts.

import crypto from "node:crypto";
import { config } from "../config.ts";

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Railway (and other env-var stores) mangle a pasted PEM in several ways: literal
// "\n" escapes instead of newlines, CRLFs, surrounding quotes, a stripped
// trailing newline, or — worst — every newline collapsed to a space so the whole
// key lands on one line. OpenSSL then rejects it (BAD_END_LINE / BAD_BASE64_DECODE).
// Rather than patch one symptom, reconstruct the PEM: find the BEGIN/END label,
// strip the body down to raw base64, and re-wrap at 64 chars with a clean header,
// footer, and trailing newline. Handles PKCS#1 ("RSA PRIVATE KEY") and PKCS#8
// ("PRIVATE KEY") alike. If it isn't a recognizable PEM, hand it back untouched so
// createSign fails loudly instead of silently mangling something valid.
export function normalizePem(raw: string): string {
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  // If it isn't already a PEM, it may be the whole key base64-encoded — the
  // cleanest single-line form for env stores that split a value on newlines
  // (Railway pastes each PEM line as a separate variable). `base64 -w0 key.pem`
  // gives one line with no quotes/escapes to mangle; decode it back to the PEM.
  if (!s.includes("BEGIN")) {
    try {
      const decoded = Buffer.from(s.replace(/\s/g, ""), "base64").toString("utf8");
      if (decoded.includes("BEGIN")) s = decoded;
    } catch {
      /* not base64 — fall through and let the PEM parse below fail loudly */
    }
  }
  s = s.replace(/\\r\\n|\\n|\\r/g, "\n").replace(/\r/g, "");
  const m = s.match(/-----BEGIN ([A-Z0-9 ]+?)-----([\s\S]*?)-----END \1-----/);
  if (!m) return s;
  const label = m[1].trim();
  const body = m[2].replace(/[^A-Za-z0-9+/=]/g, "");
  const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
  return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----\n`;
}

// ---------------------------------------------------------------------------
// App JWT
// ---------------------------------------------------------------------------

// Reusable until exp, so we don't re-sign on every call. Refreshed a bit
// before its real expiry (see the 30s guard below) rather than racing it.
let cachedJwt: { token: string; exp: number } | null = null;

/** RS256 JWT identifying the App itself (iss = app id). */
export async function appJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.exp - 30 > now) return cachedJwt.token;

  // GitHub issues App private keys in PKCS#1 ("BEGIN RSA PRIVATE KEY") form.
  // jose's importPKCS8 flatly rejects that, so we sign manually with
  // node:crypto instead of pulling in a JWT library — createSign/createVerify
  // accept BOTH PKCS#1 and PKCS#8 PEMs, so this is robust to whichever an
  // operator pastes. Railway env vars often carry the PEM with literal "\n"
  // escapes instead of real newlines; normalize before handing it to OpenSSL.
  const privateKey = normalizePem(config.githubAppPrivateKey);

  const iat = now - 60; // clock skew tolerance
  const exp = now + 9 * 60; // GitHub's hard max is 10 minutes
  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iat, exp, iss: config.githubAppId };

  const signingInput = `${b64url(Buffer.from(JSON.stringify(header)))}.${b64url(Buffer.from(JSON.stringify(payload)))}`;
  const signature = crypto.createSign("RSA-SHA256").update(signingInput).sign(privateKey);
  const token = `${signingInput}.${b64url(signature)}`;

  cachedJwt = { token, exp };
  return token;
}

/** Drops the cached App JWT. Test-only, called by github-app.ts's cache reset. */
export function __resetJwtForTest(): void {
  cachedJwt = null;
}

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

function ghHeaders(token: string, init?: RequestInit): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "redlens-preview",
    // An empty token means an unauthenticated call (public endpoints only,
    // e.g. the account-id lookup); GitHub rejects a bare `Bearer `.
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null; // non-JSON (e.g. 5xx html)
  }
}

// Calls the AMBIENT global fetch (not a captured reference) so tests can
// swap globalThis.fetch. Wraps the network call: a thrown error (DNS, abort,
// TLS…) collapses to `null` here so every caller has one shape to handle,
// instead of a propagating exception each call site would need to catch
// itself.
export async function ghFetch(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; json: any } | null> {
  try {
    const res = await fetch(url, { ...init, headers: ghHeaders(token, init) });
    return { ok: res.ok, status: res.status, json: await readJson(res) };
  } catch {
    return null;
  }
}
