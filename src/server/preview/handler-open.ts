// What opening a ready preview records: the banner's grant flag on meta.json
// and the visitor's account history.

import type { Resolved } from "./resolve.ts";
import type { PreviewMeta } from "./cache.ts";
import { recordPreviewOpen } from "./db.ts";
import { getSessionUser } from "../session.ts";
import { SHA_RE } from "./handler-http.ts";

/** Overlay a freshly-resolved All-repos grant flag onto a ready bundle's meta.
 *  The banner reads meta.json, not the resolve, and a same-sha ready bundle
 *  does not rebuild — so without this the ACCESS row would stick until the
 *  commit moved. Only call after resolvePrivateBranch (a SHA/DB resolve never
 *  re-derives the flag, and applying this there would wipe a still-valid row).
 *  Returns the patched meta, or null when nothing changed. */
export function syncBroadGrantMeta(
  meta: PreviewMeta,
  r: Pick<Resolved, "grantTooBroad" | "installSettingsUrl">,
): PreviewMeta | null {
  const want = !!r.grantTooBroad;
  const have = !!meta.grantTooBroad;
  const wantUrl = want ? r.installSettingsUrl : undefined;
  const haveUrl = have ? meta.installSettingsUrl : undefined;
  if (want === have && wantUrl === haveUrl) return null;
  const next: PreviewMeta = { ...meta };
  if (want) {
    next.grantTooBroad = true;
    if (r.installSettingsUrl) next.installSettingsUrl = r.installSettingsUrl;
    else delete next.installSettingsUrl;
  } else {
    delete next.grantTooBroad;
    delete next.installSettingsUrl;
  }
  return next;
}

/** Record a signed-in visitor's open against their ACCOUNT, so /preview's recent
 *  list follows them to their next browser. Anonymous visitors get nothing here —
 *  their localStorage record (previewLocal.ts) is the only one, by design.
 *
 *  Called once per `ready`, which is the earliest point that is true: the sha is
 *  resolved, the takedown check has passed, a private repo has been authorized,
 *  and the build (which upserts the previews row this later JOINs to) is done.
 *  Exported for the test that drives it without an SSE stream. */
export async function rememberPreviewOpen(req: Request, previewId: string, sha: string): Promise<void> {
  const session = await getSessionUser(req);
  if (!session) return;
  // A bare-sha id is case-insensitive (resolveId already lowercases it), so record
  // it lowercased or `/preview/ABC…` and `/preview/abc…` become two rows for one
  // preview. Every other id form keeps its case: a branch name is case-SENSITIVE
  // in git, so `owner:repo:Fix` and `owner:repo:fix` are genuinely different refs.
  await recordPreviewOpen(session.user.id, SHA_RE.test(previewId) ? previewId.toLowerCase() : previewId, sha);
}
