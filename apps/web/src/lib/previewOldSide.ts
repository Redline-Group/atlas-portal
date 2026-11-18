// The old side of a preview's redline: before.json (each changed document as
// it stood on the diff base, loaded lazily, the first time a history tab asks)
// and removed.json (each removed document, loaded with diff.json because the
// tree shows them). Both come per diff base, like diff.json: `<stem>.<key>.json`
// for a candidate, falling back to the plain `<stem>.json` the auto base wrote.

import type { PreviewBaseKey } from "./previewMetaCopy";
import type { BeforeEntry, RemovedDoc } from "@/lib/previewPatch";

/** `<stem>.<key>.json`, else `<stem>.json`, else null. */
export async function fetchKeyed<T>(base: string, stem: string, key: PreviewBaseKey | null): Promise<T | null> {
  const plain = () => fetch(`${base}${stem}.json`).then((r) => (r.ok ? (r.json() as Promise<T>) : null));
  try {
    if (!key) return await plain();
    const keyed = await fetch(`${base}${stem}.${key}.json`);
    return keyed.ok ? ((await keyed.json()) as T) : await plain();
  } catch {
    return null;
  }
}

const beforeCache = new Map<string, Promise<Record<string, BeforeEntry>>>();

/** before.json for one base, cached for the page's life. Empty when the bundle has none. */
export function loadPreviewBefore(base: string, key: PreviewBaseKey | null): Promise<Record<string, BeforeEntry>> {
  const cacheKey = `${base}${key ?? ""}`;
  let p = beforeCache.get(cacheKey);
  if (!p) {
    p = fetchKeyed<Record<string, BeforeEntry>>(base, "before", key).then((b) => b ?? {});
    beforeCache.set(cacheKey, p);
  }
  return p;
}

/** removed.json for one base. Empty when the bundle has none (built before it was written). */
export async function loadPreviewRemoved(base: string, key: PreviewBaseKey | null): Promise<RemovedDoc[]> {
  const docs = await fetchKeyed<RemovedDoc[]>(base, "removed", key);
  return Array.isArray(docs) ? docs : [];
}
