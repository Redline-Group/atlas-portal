// drive(): what one /api/preview/:id/events stream does, from rate limit to
// `ready` or a build subscription. The SSE transport is handler-events.ts.

import { decodeId, type Resolved } from "./resolve.ts";
import { getOrStartBuild, subscribeBuild, type PreviewEvent } from "./build.ts";
import { bundleReady, readMeta, writeMeta, touch } from "./cache.ts";
import { touchPreview } from "./db.ts";
import { fillPrivateDiffBaseOnOpen } from "./diff-base-on-open.ts";
import { authorizePreviewAccess } from "./access.ts";
import { appInstallUrl } from "./github-app.ts";
import { rateLimited } from "./rate-limit.ts";
import { resolveAuthorized, takedownBlocked, needsBaseRebuild, type GateDenied, type GateOpened } from "./open-gate.ts";
import { rememberPreviewOpen, syncBroadGrantMeta } from "./handler-open.ts";

type Send = (ev: PreviewEvent) => void;
const noop = () => {};

// An app-not-installed failure carries the App's install URL so the client can
// offer a one-click "Install the Sky Atlas by Redline GitHub App" action instead of dead-end copy;
// every other failure code has no attached message.
async function failInstallMessage(code: string, repo: string | undefined): Promise<string | undefined> {
  return code === "app-not-installed" ? ((await appInstallUrl(repo).catch(() => null)) ?? undefined) : undefined;
}

/** The repo a preview id names, for targeting the install link at its owner. */
function repoOfId(rawId: string): string | undefined {
  const p = decodeId(rawId);
  return p?.kind === "branch" ? p.repo : undefined;
}

async function sendDenied(opened: GateDenied, rawId: string, send: Send): Promise<void> {
  const d = opened.denied;
  if (d === "login-required" || d === "forbidden" || d === "unavailable") {
    send({ phase: "failed", code: d === "login-required" ? "auth-required" : d });
  } else {
    send({ phase: "failed", code: d, message: await failInstallMessage(d, opened.repo ?? repoOfId(rawId)) });
  }
}

// Every `ready` a stream emits — from the cached bundle or from a build — is
// an open by this visitor, so they all go through this one wrapper rather than
// recording at each site. Fire-and-forget: the account history must never
// delay, or fail, opening a preview.
function recordingSender(req: Request, rawId: string, sha: string, send: Send): Send {
  return (ev) => {
    if (ev.phase === "ready") void rememberPreviewOpen(req, rawId, sha).catch(() => {});
    send(ev);
  };
}

/** A bundle already on disk: rebuild it if its base moved, else serve it. */
function serveReadyBundle({ r, viaPrivateResolve }: GateOpened, sendRecording: Send): () => void {
  const sha = r.sha;
  const meta = readMeta(sha);
  if (needsBaseRebuild(r, meta)) {
    getOrStartBuild(r);
    return subscribeBuild(sha, sendRecording);
  }
  // Banner-only: keep ACCESS in sync with the live install without a rebuild.
  // Only a resolvePrivateBranch result carries a fresh repository_selection;
  // a SHA/DB resolve never carries grantTooBroad and would clear a valid row.
  if (meta && viaPrivateResolve) {
    const synced = syncBroadGrantMeta(meta, r);
    if (synced) writeMeta(sha, synced);
  }
  touch(sha);
  void touchPreview(sha).catch(() => {});
  // Disk wiped → a rebuild records the diff base. Disk still here and the
  // row predates the columns → fill it without making this open wait.
  if (r.private) fillPrivateDiffBaseOnOpen(r, meta);
  sendRecording({ phase: "ready", sha });
  return noop;
}

// Returns the unsubscribe fn for the SSE stream (noop if it terminated synchronously).
export async function drive(req: Request, rawId: string, ip: string, send: Send): Promise<() => void> {
  if (rateLimited(ip)) {
    send({ phase: "failed", code: "rate-limited", message: "Too many preview requests — try again shortly." });
    return noop;
  }
  send({ phase: "resolving" });
  // G3/G7: open-gate authorizes a private repo BEFORE any sha-bearing event
  // (isBlockedSha/bundleReady/build) reaches an unauthorized caller.
  const opened = await resolveAuthorized(rawId, (repo) => authorizePreviewAccess(req, repo));
  if ("denied" in opened) {
    await sendDenied(opened, rawId, send);
    return noop;
  }
  const r: Resolved = opened.r;
  const sha = r.sha;
  const sendRecording = recordingSender(req, rawId, sha, send);
  if (await takedownBlocked(sha)) {
    send({ phase: "failed", code: "not-found" });
    return noop;
  }
  if (bundleReady(sha)) return serveReadyBundle(opened, sendRecording);
  getOrStartBuild(r);
  return subscribeBuild(sha, sendRecording);
}
