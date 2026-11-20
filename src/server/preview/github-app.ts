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
//
// The App JWT and the shared fetch live in github-app-jwt.ts.

import { config } from "../config.ts";
import { createCache } from "../ttl-cache.ts";
import { __resetJwtForTest, appJwt, ghFetch } from "./github-app-jwt.ts";

// ---------------------------------------------------------------------------
// App metadata (install URL)
// ---------------------------------------------------------------------------

// The App's public install page — https://github.com/apps/<slug>/installations/new.
// We only configure the numeric app id + private key, not the slug, so derive it
// from GET /app (an app-JWT call). Cached on first success for the process; a
// failure returns null (and is NOT cached, so the next request retries) so the
// caller falls back to generic "ask the owner" copy rather than a broken link.
let cachedInstallUrl: string | null = null;

// GitHub's install page also accepts `/installations/new/permissions?target_id=<account id>`,
// which skips the account picker and opens the permission screen for THAT account
// only — so an installer is never offered every org they belong to. The id of a
// user or org is public (GET /users/<login>, no auth needed), so it can be looked
// up for the repo the preview named even though the App can't see the repo yet.
// GitHub's docs name the key `suggested_target_id` (marked required on that path)
// while its own install buttons emit `target_id`; both are sent so the link is
// right whichever one this path honours.
// The repository itself CAN'T be pre-set: `repository_ids[]` ticks "Only select
// repositories" with the listed repos, but a private repo's numeric id is
// invisible until the App is installed on it — exactly the state this link is
// shown in. So we pass a PLACEHOLDER id the account can't own: GitHub drops ids
// the target doesn't own, and the presence of the parameter is what flips the
// selector off its "All repositories" default. Decided 2026-09-17 without a
// verified GitHub reference (docs unreachable from the sandbox) — if the
// install page ever errors on it, drop INSTALL_REPO_PLACEHOLDER first. The
// install screen's copy names the repo to pick either way.
const INSTALL_REPO_PLACEHOLDER = "&repository_ids[]=0";
// Account ids never change; the TTL only bounds a deleted/renamed login.
const ownerIdCache = createCache<number>({ max: 1000, ttlMs: 24 * 60 * 60_000 });

/** Numeric GitHub account id for a user/org login, or null if unknown. Public endpoint. */
export async function accountIdForLogin(login: string): Promise<number | null> {
  const now = Date.now();
  const cached = ownerIdCache.get(login);
  if (cached !== undefined) return cached;
  const r = await ghFetch(`https://api.github.com/users/${encodeURIComponent(login)}`, config.githubToken);
  const id = r?.ok ? r.json?.id : null;
  if (typeof id !== "number" || !Number.isFinite(id)) return null;
  ownerIdCache.set(login, id, now);
  return id;
}

/**
 * The App's install URL, or null if it couldn't be determined (unconfigured/failed).
 * With `repo` ("owner/name"), targets that owner's account when its id resolves
 * (`/installations/new/permissions?suggested_target_id=…&target_id=…&repository_ids[]=0`, the placeholder
 * pre-selecting "Only select repositories"); otherwise the generic page.
 */
export async function appInstallUrl(repo?: string): Promise<string | null> {
  if (!cachedInstallUrl) {
    if (!config.githubAppId || !config.githubAppPrivateKey) return null;
    const r = await ghFetch("https://api.github.com/app", await appJwt());
    const slug = r?.ok ? r.json?.slug : null;
    if (typeof slug === "string" && slug) cachedInstallUrl = `https://github.com/apps/${slug}/installations/new`;
    if (!cachedInstallUrl) return null;
  }
  const owner = repo?.split("/")[0];
  if (!owner) return cachedInstallUrl;
  const id = await accountIdForLogin(owner);
  if (id === null) return cachedInstallUrl;
  return `${cachedInstallUrl}/permissions?suggested_target_id=${id}&target_id=${id}${INSTALL_REPO_PLACEHOLDER}`;
}

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
  __resetJwtForTest();
  cachedInstallUrl = null;
  ownerIdCache.clear();
  installationCache.clear();
  installationTokenCache.clear();
}
