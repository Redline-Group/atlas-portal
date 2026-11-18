import type { ActiveBase, PreviewBaseKey, PreviewBases } from "./previewMetaCopy";
import { loadPreviewMeta } from "./previewMeta";
import type { PreviewDiff } from "./previewDiff";
import { fetchKeyed, loadPreviewRemoved } from "./previewOldSide";

function resolveBase(baseKey: PreviewBaseKey | null, bases: PreviewBases | undefined) {
  if (!bases) return { fetchKey: null, activeBase: null };
  const requested = baseKey ?? bases.auto;
  if ((requested === "sky" || requested === "repo") && bases[requested]) {
    const cand = bases[requested]!;
    return {
      fetchKey: requested,
      activeBase: { key: requested, repo: cand.repo, ref: cand.ref, auto: baseKey === null || baseKey === bases.auto },
    };
  }
  return autoBase(bases);
}

function autoBase(bases: PreviewBases): { fetchKey: null; activeBase: ActiveBase } {
  if (bases.auto === "sky" && bases.sky) return { fetchKey: null, activeBase: { key: "sky", repo: bases.sky.repo, ref: bases.sky.ref, auto: true } };
  if (bases.auto === "repo" && bases.repo) return { fetchKey: null, activeBase: { key: "repo", repo: bases.repo.repo, ref: bases.repo.ref, auto: true } };
  return { fetchKey: null, activeBase: { key: "live-main", auto: true } };
}

async function fetchDiff(base: string, fetchKey: PreviewBaseKey | null) {
  const { value: doc, usedKey } = await fetchKeyed<Record<string, unknown>>(base, "diff", fetchKey);
  return { doc, usedKey };
}

function diffFromDoc(d: Record<string, unknown>, activeBase: ActiveBase | null): PreviewDiff {
  const ids = (value: unknown) => new Set<string>((value as string[] | undefined) ?? []);
  return {
    added: ids(d.added),
    changed: ids(d.changed),
    removed: d.removed ? ids(d.removed) : undefined,
    alreadyOnMain: d.alreadyOnMain ? ids(d.alreadyOnMain) : undefined,
    mainAlsoChanged: d.mainAlsoChanged ? ids(d.mainAlsoChanged) : undefined,
    renumbered: (d.renumbered as PreviewDiff["renumbered"]) ?? {},
    renumberedOnly: d.renumberedOnly ? new Set<string>(d.renumberedOnly as string[]) : undefined,
    retitled: (d.retitled as PreviewDiff["retitled"]) ?? {},
    retyped: (d.retyped as PreviewDiff["retyped"]) ?? {},
    reusedSlot: reusedSlotOf(d.reusedSlot),
    identitySwap: (d.identitySwap as PreviewDiff["identitySwap"]) ?? {},
    formerUuid: (d.formerUuid as PreviewDiff["formerUuid"]) ?? {},
    activeBase,
  };
}

function reusedSlotOf(value: unknown): PreviewDiff["reusedSlot"] {
  if (Array.isArray(value)) return Object.fromEntries((value as string[]).map((id) => [id, {}]));
  return (value as PreviewDiff["reusedSlot"]) ?? {};
}

/** diff.json for the provider, or null when the bundle has none. `usedKey` is the pair the file answered. */
export async function fetchPreviewDiff(base: string, baseKey: PreviewBaseKey | null) {
  const meta = await loadPreviewMeta(base);
  const { fetchKey, activeBase } = resolveBase(baseKey, meta?.bases);
  const { doc, usedKey } = await fetchDiff(base, fetchKey);
  if (!doc) return null;
  // The removed documents' full records come after: the marks, filters and
  // counts need only diff.json, and removed.json can be large.
  const removedDocs = (doc.removed as unknown[] | undefined)?.length ? loadPreviewRemoved(base, usedKey) : Promise.resolve([]);
  return { diff: diffFromDoc(doc, activeBase), usedKey, removedDocs };
}
