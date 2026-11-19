// The App's install URL and the account-id lookup behind it.
import { config } from "../config.ts";
import { createCache } from "../ttl-cache.ts";
import { appJwt } from "./github-app-jwt.ts";
import { ghFetch } from "./github-app-fetch.ts";

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
// selector off its "All repositories" default. No GitHub document confirms this
// behavior, so if the install page ever errors on it, drop
// INSTALL_REPO_PLACEHOLDER first. The
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


/** Clears the install-URL and account-id caches. Test-only. */
export function resetInstallUrlCaches(): void {
  cachedInstallUrl = null;
  ownerIdCache.clear();
}
