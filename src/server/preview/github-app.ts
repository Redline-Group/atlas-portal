// Server-to-server GitHub App auth for private atlas previews.
//
// Two distinct credentials are in play here, and it matters which one goes
// where:
//   - the APP JWT (appJwt()) — signed with the App's own private key,
//     identifies the App itself. Valid only for app-level calls: looking up
//     an installation, minting an installation token.
//   - the INSTALLATION TOKEN (installationToken()) — minted using the app
//     JWT, scoped to one repo's installation. Used for every repo-scoped
//     call: the private tarball download (elsewhere) and the permission
//     checks below.
//
// This module backs an access-control decision (does this GitHub user get to
// see this private atlas preview?), so every uncertain outcome — a network
// throw, an unexpected response shape, a 5xx — DENIES rather than grants.
// Never widen a catch/fallback to "ok: true" here.

import { createCache } from "../ttl-cache.ts";
import { appJwt, resetAppJwtCache } from "./github-app-jwt.ts";
import { ghFetch } from "./github-app-fetch.ts";
import { resetInstallUrlCaches } from "./github-app-install-url.ts";

export { appJwt, normalizePem } from "./github-app-jwt.ts";
export { accountIdForLogin, appInstallUrl } from "./github-app-install-url.ts";

// ---------------------------------------------------------------------------
// Installation lookup + token minting
// ---------------------------------------------------------------------------

// TTL'd, not permanent: an uninstall+reinstall mints a NEW installation id, so a
// permanently-cached old id would strand the repo on a dead id until process
// restart. Bounded staleness + eviction-on-mint-failure (see installationToken)
// recover from a reinstall promptly.
const INSTALLATION_ID_TTL_MS = 30 * 60_000;

export interface InstallationInfo {
  id: number;
  /** Configure page for this install (user or org). Null if GitHub omitted it. */
  htmlUrl: string | null;
  /** Repo permissions this install has actually granted (not the App's requested set). */
  permissions: Record<string, string>;
  /** GitHub's `repository_selection`: "all" = every repo on the account, "selected" =
   *  a chosen list. Null when GitHub omitted or mis-shaped it. */
  repositorySelection: "all" | "selected" | null;
}

const installationCache = createCache<InstallationInfo>({ max: 1000, ttlMs: INSTALLATION_ID_TTL_MS }); // FIFO cap

function parseInstallation(json: any): InstallationInfo | null {
  const id = json?.id;
  if (typeof id !== "number") return null;
  const htmlUrl = typeof json?.html_url === "string" && json.html_url ? json.html_url : null;
  const permissions: Record<string, string> = {};
  const raw = json?.permissions;
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string") permissions[k] = v;
    }
  }
  const sel = json?.repository_selection;
  const repositorySelection = sel === "all" || sel === "selected" ? sel : null;
  return { id, htmlUrl, permissions, repositorySelection };
}

/** GitHub's pending-permission review screen for an install, or null if we have no html_url. */
export function permissionsUpdateUrl(htmlUrl: string | null | undefined): string | null {
  if (typeof htmlUrl !== "string" || !htmlUrl) return null;
  return `${htmlUrl.replace(/\/+$/, "")}/permissions/update`;
}

/** True when this install has granted Pull requests: read or write. */
export function installationHasPullsRead(permissions: Record<string, string> | undefined): boolean {
  const p = permissions?.pull_requests;
  return p === "read" || p === "write";
}

/** The App's installation for `repo`, or null if not installed / lookup failed.
 *  `refresh` skips the cache read (the write still happens) — for the one
 *  reader that must not serve a stale answer, see resolve.ts's broadGrant. */
export async function installationInfoForRepo(repo: string, opts?: { refresh?: boolean }): Promise<InstallationInfo | null> {
  const now = Date.now();
  const cached = opts?.refresh ? undefined : installationCache.get(repo);
  if (cached) return cached;

  const r = await ghFetch(`https://api.github.com/repos/${repo}/installation`, await appJwt());
  if (!r) return null; // network throw
  if (!r.ok) {
    // 404 = App not installed on this repo — an expected, non-error outcome,
    // so no log. Anything else (401/403/5xx/…) is unexpected; log at debug
    // and still return null — an uninstalled-looking repo is the safe read.
    if (r.status !== 404) console.debug(`[github-app] installation lookup failed for ${repo}: ${r.status}`);
    return null;
  }
  const info = parseInstallation(r.json);
  if (!info) return null;

  installationCache.set(repo, info, now);
  return info;
}

/** The App's installation id for `repo`, or null if not installed / lookup failed. */
export async function installationIdForRepo(repo: string): Promise<number | null> {
  const info = await installationInfoForRepo(repo);
  return info?.id ?? null;
}

// GitHub tokens expire ~60min from mint; cache for 55min so we refresh a
// little early instead of racing expiry mid-request.
const installationTokenCache = createCache<string>({ max: 1000, ttlMs: 55 * 60_000 });

/** A short-lived, repo-scoped installation access token, or null if unavailable. */
export async function installationToken(repo: string): Promise<string | null> {
  const now = Date.now();
  const cached = installationTokenCache.get(repo);
  if (cached) return cached;

  const id = await installationIdForRepo(repo);
  if (id === null) return null;

  const r = await ghFetch(`https://api.github.com/app/installations/${id}/access_tokens`, await appJwt(), {
    method: "POST",
  });
  if (!r || !r.ok) {
    // A mint failure against a cached id is the tell-tale of a removed/reinstalled
    // installation (the id is now dead). Evict it so the next call re-resolves the
    // current installation id instead of retrying the stale one until it expires.
    installationCache.delete(repo);
    return null;
  }

  // Treat the token as opaque — GitHub is rolling out a longer stateless
  // format, so no assumption about a "ghs_..." prefix or fixed length.
  const token = r.json?.token;
  if (typeof token !== "string" || !token) return null;

  installationTokenCache.set(repo, token, now);
  return token;
}

/**
 * Drop the cached installation info for `repo`, so the next lookup re-reads
 * the install's CURRENT grant. The info cache holds the granted permission set
 * for 30 minutes — after an owner accepts a new permission (Pull requests:
 * Read) it keeps answering with the old one. resolve.ts calls this when a
 * private PR falls back to the Contents-only path. Cheap on purpose (one
 * app-JWT GET): it runs on every such resolve while the permission is missing.
 */
export function forgetInstallationInfo(repo: string): void {
  installationCache.delete(repo);
}

/**
 * Drop the cached installation token for `repo`. A token keeps the permissions
 * it was MINTED with, so one minted before a grant still 403s on what the
 * grant added. Only worth calling once the fresh install info shows the grant
 * — until then a re-mint buys nothing and costs a token per resolve.
 */
export function forgetInstallationToken(repo: string): void {
  installationTokenCache.delete(repo);
}

// ---------------------------------------------------------------------------
// Repo-scoped calls (installation token)
// ---------------------------------------------------------------------------

export type PermissionResult =
  | { ok: true; userId: number; permission: string }
  | { ok: false; reason: "forbidden" }
  | { ok: false; reason: "unavailable" };

/**
 * Effective repo permission for `login` (highest across repo/team/org/
 * enterprise grants — that's what this endpoint returns). Fails closed:
 * anything short of a clean, well-typed grant denies.
 */
export async function userRepoPermission(repo: string, login: string): Promise<PermissionResult> {
  const token = await installationToken(repo);
  if (!token) return { ok: false, reason: "unavailable" };

  const r = await ghFetch(
    `https://api.github.com/repos/${repo}/collaborators/${encodeURIComponent(login)}/permission`,
    token,
  );
  if (!r) return { ok: false, reason: "unavailable" }; // network throw

  // 404 is GitHub's documented shape for "not a collaborator" — a clean deny,
  // not a failure.
  if (r.status === 404) return { ok: false, reason: "forbidden" };
  // 5xx (and any other non-ok, e.g. a misbehaving/rate-limited 4xx) is a
  // genuine uncertainty, not a permission answer — fail closed as
  // "unavailable" rather than reading it as a deny or a grant.
  if (!r.ok) return { ok: false, reason: "unavailable" };

  const permission = r.json?.permission;
  if (permission === "none") return { ok: false, reason: "forbidden" };

  const userId = r.json?.user?.id;
  const hasRead =
    permission === "read" ||
    permission === "write" ||
    permission === "admin" ||
    r.json?.user?.permissions?.pull === true;

  if (hasRead && typeof userId === "number") {
    return { ok: true, userId, permission };
  }
  // Any other shape (missing/non-numeric user id, unrecognized permission
  // string) — don't guess, deny.
  return { ok: false, reason: "forbidden" };
}

// ---------------------------------------------------------------------------
// Test-only cache reset
// ---------------------------------------------------------------------------

/** Clears in-process caches. Test-only — production code never needs this. */
export function __resetCachesForTest(): void {
  resetAppJwtCache();
  resetInstallUrlCaches();
  installationCache.clear();
  installationTokenCache.clear();
}
