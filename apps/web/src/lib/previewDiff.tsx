import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useDataSource } from "./dataSource";
import { usePreviewView } from "./previewView";
import type { ActiveBase } from "./previewMetaCopy";
import type { RemovedDoc } from "@/lib/previewPatch";
import { fetchPreviewDiff } from "./previewDiffLoad";
import { loadIdentityVerdict } from "./previewIdentity";

// Doc ids the preview adds / changes / removes against its diff base — the
// branch's merge base, so only its own edits count (from GET diff.json).
// Drives the new/changed/removed redline indicators. `renumbered` maps a changed
// doc id to its [base, preview] doc numbers when the change includes a move.
// Empty (and no fetch) outside preview mode, so the default context works
// everywhere without a provider.
/** UUID-identity reassignment value: id → old/new titles and (best-effort)
 *  where the displaced old content moved to. */
export interface IdentitySwap {
  oldTitle: string;
  newTitle: string;
  movedTo?: { id: string; doc_no: string; title: string };
}

/** The other side of a swap: a doc that received content which previously
 *  lived under a different uuid. */
export interface FormerUuid {
  previousId: string;
  previousTitle: string;
  previousDocNo: string;
}

export interface PreviewDiff {
  added: Set<string>;
  changed: Set<string>;
  /** On the diff base, gone from the preview. Absent on bundles built before it was recorded. */
  removed?: Set<string>;
  /** removed.json: each removed document in full, with where it stood, in
   *  base order. The tree and reader show them in place (previewRemoved.ts). */
  removedDocs?: RemovedDoc[];
  /** Docs the branch changed whose change live main already has, so they are
   *  not marked as changes. Absent when the build applied no such rule (a
   *  merged PR, a repo base) or predates it. */
  alreadyOnMain?: Set<string>;
  renumbered: Record<string, [string, string]>;
  /** Changed docs whose only change is the doc number. Absent on bundles
   *  built before the build recorded it. */
  renumberedOnly?: Set<string>;
  /** Changed docs whose title differs from the diff base (title-only or
   *  title+content edits). id → [base title, preview title]. */
  retitled: Record<string, [string, string]>;
  /** Changed docs whose `[Type]` differs from the diff base: id → [base type,
   *  preview type]. */
  retyped: Record<string, [string, string]>;
  /** Added docs whose doc number the diff base gave another uuid:
   *  id → the old occupant's title + where it sits in this preview (absent =
   *  removed by the preview). */
  reusedSlot: Record<string, { title?: string; movedTo?: string }>;
  /** UUID-identity reassignment: a stable uuid whose underlying *document* was
   *  wholly replaced (different title + rewritten body). id → old/new titles and
   *  (best-effort) where the displaced old content moved to. Drives the ⚠. */
  identitySwap: Record<string, IdentitySwap>;
  /** The other side of a swap: a new doc that received content which previously
   *  lived under a different uuid. id → that previous uuid + its old identity. */
  formerUuid: Record<string, FormerUuid>;
  /** The diff-base actually resolved for this bundle (a `?base=` override
   *  reconciled against what the bundle's meta.json actually offers).
   *  Optional for back-compat with mocks built before this field existed —
   *  every real consumer should read it via `?? null`. Null outside preview
   *  mode, before meta.json resolves, and for bundles built before per-base
   *  diffs existed. */
  activeBase?: ActiveBase | null;
  /** True while a preview's diff.json has not been read yet: its empty sets
   *  then mean "not known", not "nothing changed". Absent once it has (and
   *  outside preview). */
  pending?: boolean;
}

const EMPTY: PreviewDiff = {
  added: new Set(),
  changed: new Set(),
  renumbered: {},
  retitled: {},
  retyped: {},
  reusedSlot: {},
  identitySwap: {},
  formerUuid: {},
  activeBase: null,
};

const PENDING: PreviewDiff = { ...EMPTY, pending: true };

const PreviewDiffContext = createContext<PreviewDiff>(EMPTY);

export function usePreviewDiff(): PreviewDiff {
  return useContext(PreviewDiffContext);
}

export function PreviewDiffProvider({ children }: { children: ReactNode }) {
  const { base, preview } = useDataSource();
  const { baseKey } = usePreviewView();
  const [diff, setDiff] = useState<PreviewDiff>(preview ? PENDING : EMPTY);
  useEffect(() => {
    if (!preview) return setDiff(EMPTY);
    let live = true;
    const gone = new AbortController();
    showPreviewDiff(base, baseKey, () => live, gone.signal, setDiff);
    return () => {
      live = false;
      gone.abort();
    };
  }, [base, preview, baseKey]);
  return <PreviewDiffContext.Provider value={diff}>{children}</PreviewDiffContext.Provider>;
}

function showPreviewDiff(
  base: string,
  baseKey: ReturnType<typeof usePreviewView>["baseKey"],
  live: () => boolean,
  signal: AbortSignal,
  setDiff: (next: PreviewDiff | ((now: PreviewDiff) => PreviewDiff)) => void,
) {
  fetchPreviewDiff(base, baseKey).then(async (loaded) => {
    if (!live()) return;
    if (!loaded) {
      setDiff(EMPTY);
      return;
    }
    setDiff(loaded.diff);
    const verdict = await loadIdentityVerdict(base, loaded.usedKey, { signal });
    if (live() && verdict) setDiff((now) => ({ ...now, ...verdict }));
  });
}
