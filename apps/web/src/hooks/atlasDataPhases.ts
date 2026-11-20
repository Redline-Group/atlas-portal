// The two load phases behind useAtlasData. Each takes the hook's setters as a
// sink and writes only while the effect that started it is still live.
import { startTransition, type Dispatch, type SetStateAction } from "react";
import { loadAtlas, loadAtlasShallow, type AtlasBundle } from "../lib/docs";
import { loadAddresses } from "../lib/addresses";
import { loadChainState } from "../lib/chainstate";
import { loadGlossary } from "../lib/glossary";
import { setAddressMap } from "../lib/addressMap";
import { flattenTree, type LoadedData } from "@/lib/atlasHelpers";

export interface AtlasDataSink {
  /** False once the effect that started the phase has been cleaned up. */
  isLive: () => boolean;
  setData: Dispatch<SetStateAction<LoadedData | null>>;
  setShallowError: (e: Error | null) => void;
  setDeepError: (e: Error | null) => void;
}

type Enrichments = Pick<LoadedData, "addresses" | "chainState" | "glossary">;

export const toError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

// Addresses, chain state, and glossary are enrichments; fail silently so a
// missing artifact (e.g. no glossary.json on a partial build) doesn't block
// the whole reader.
const safe = <T>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

/** Enrichments are null until phase 2; `complete: false` marks the tree as still-loading. */
function shallowBundle(atlas: AtlasBundle): LoadedData {
  return { atlas, flatNodes: flattenTree(atlas.byParent), addresses: null, chainState: null, glossary: null, complete: false };
}

/** `complete: true` lets the reader resolve deep-linked deep nodes. */
function fullBundle(atlas: AtlasBundle, enrichments: Enrichments): LoadedData {
  return { atlas, flatNodes: flattenTree(atlas.byParent), ...enrichments, complete: true };
}

// Phase 1 — SHALLOW: render the full initial visible tree from docs-shallow.json
// (depth ≤ 5, ~159 KB gz, content included) the instant it lands, before the
// heavier docs-deep.json (depth > 5, ~663 KB gz — gated behind "view all
// descendants", so off the first-paint path). It only ever fills in a null
// `data`, so a retry never clobbers a working view. See docs/plans/docs-split.md.
export function loadShallowPhase(base: string, sink: AtlasDataSink): void {
  loadAtlasShallow(base)
    .then((atlas) => {
      if (!sink.isLive()) return;
      sink.setShallowError(null);
      startTransition(() => {
        sink.setData((prev) => prev ?? shallowBundle(atlas));
      });
    })
    .catch((err) => {
      // Load-bearing: without shallow there's nothing to render — surface it
      // instead of leaving the caller in an eternal loading state with no
      // way out (see AtlasView). A retry that re-requests shallow only
      // because deep alone had failed lands here too if it happens to fail
      // this time; `data` from the earlier successful attempt is untouched.
      if (!sink.isLive()) return;
      sink.setShallowError(toError(err));
    });
}

// In preview mode docs + glossary come from the preview bundle (`base`); chain
// state is reused from main.
async function loadEnrichments(base: string): Promise<Enrichments> {
  const [addresses, chainState, glossary] = await Promise.all([
    safe(loadAddresses(base)),
    safe(loadChainState()),
    safe(loadGlossary(base)),
  ]);
  return { addresses, chainState, glossary };
}

// Phase 2 — FULL: docs-deep merged in (all depths) + enrichments. Replaces the
// shallow set. loadAtlas is load-bearing — docs must succeed for the reader to
// render.
export function loadFullPhase(base: string, sink: AtlasDataSink): void {
  loadAtlas(base)
    .then(async (atlas) => {
      const enrichments = await loadEnrichments(base);
      if (!sink.isLive()) return;
      if (enrichments.addresses) setAddressMap(enrichments.addresses, base);
      sink.setDeepError(null);
      startTransition(() => {
        sink.setData(fullBundle(atlas, enrichments));
      });
    })
    // A stale-sha rejection already triggers a force-forward reload
    // (handledStaleMessage in the worker error path — that promise never
    // settles, so this .catch never fires for it). Any other deep-load
    // failure keeps the shallow-only view (data.complete stays false, never
    // destroyed — see lib/docs.ts spawn()) and is surfaced as a non-blocking
    // error the caller can retry() instead of an eternal spinner.
    .catch((err) => {
      if (!sink.isLive()) return;
      sink.setDeepError(toError(err));
    });
}
