import { useState, useEffect, useRef, useCallback } from "react";
import { type LoadedData } from "@/lib/atlasHelpers";
import { useDataSource } from "../lib/dataSource";
import { loadFullPhase, loadShallowPhase, toError } from "./atlasDataPhases";

/** Load any module-level cached promise (loadGraph, loadAtlas, loadDocs, etc.)
 *  and return the resolved value, or null while loading.
 *
 *  On rejection the loader's error is re-thrown during render so the nearest
 *  ErrorBoundary (App wraps every route) shows its page-level error UI — a load
 *  failure must not become a permanent "Loading…" spinner + an unhandled promise
 *  rejection. Pass `{ soft: true }` when the data is a non-load-bearing
 *  enrichment (e.g. the graph panel inside the reader): the failure is still
 *  caught (no unhandled rejection) but returns null instead of blanking the page. */
export function useLoaded<T>(loader: () => Promise<T>, opts?: { soft?: boolean }): T | null {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const ref = useRef(loader);
  const soft = opts?.soft ?? false;
  useEffect(() => {
    let live = true;
    ref.current().then(
      (v) => { if (live) setData(v); },
      (e) => { if (live) setError(toError(e)); },
    );
    return () => { live = false; };
  }, []);
  if (error && !soft) throw error;
  return data;
}

export interface AtlasDataState {
  /** The shallow-or-full bundle; null until docs-shallow.json (load-bearing)
   *  first lands, or if it failed and no retry has succeeded yet. */
  data: LoadedData | null;
  /** docs-shallow.json itself failed to load. `data` stays null while this is
   *  set — the blocking failure mode (there is nothing to render). Cleared
   *  optimistically on retry() and for real once shallow next resolves. */
  shallowError: Error | null;
  /** docs-deep.json (or an enrichment fetch reached through it) failed AFTER
   *  shallow succeeded. `data` still holds the rendered shallow tree
   *  (complete: false) — a non-blocking failure the reader can keep working
   *  around. Cleared optimistically on retry() and for real once the full
   *  bundle next resolves. */
  deepError: Error | null;
  /** Re-attempts whichever phase(s) haven't succeeded yet. A retry never
   *  clears already-good `data` — a deep-only retry re-requests shallow too
   *  (harmless: phase 1 below only ever fills in a null `data`), but the
   *  rendered tree stays on screen throughout. */
  retry: () => void;
}

export function useAtlasData(): AtlasDataState {
  const { base } = useDataSource();
  const [data, setData] = useState<LoadedData | null>(null);
  const [shallowError, setShallowError] = useState<Error | null>(null);
  const [deepError, setDeepError] = useState<Error | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  // Tracks the base the effect last ran for, so a bare retry (same base,
  // retryTick bumped) can be told apart from an actual data-source switch
  // (live ↔ preview) — only the latter should blow away already-rendered data.
  const prevBaseRef = useRef<string | null>(null);

  useEffect(() => {
    let live = true;
    if (prevBaseRef.current !== base) {
      prevBaseRef.current = base;
      setData(null);
      setShallowError(null);
      setDeepError(null);
    }
    const sink = { isLive: () => live, setData, setShallowError, setDeepError };
    loadShallowPhase(base, sink);
    loadFullPhase(base, sink);
    return () => {
      live = false;
    };
  }, [base, retryTick]);

  const retry = useCallback(() => {
    // Optimistic clear: an in-flight retry reads as "loading" rather than
    // holding the stale error on screen until the new attempt settles.
    setShallowError(null);
    setDeepError(null);
    setRetryTick((t) => t + 1);
  }, []);

  return { data, shallowError, deepError, retry };
}
