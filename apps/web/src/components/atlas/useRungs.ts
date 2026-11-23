import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import { DEFAULT_RUNG, type Rung, type RungLevel } from "./subtreeState";

type RungMap = ReadonlyMap<string, Rung>;

// Both updaters return the previous Map identity when nothing actually
// changes — load-bearing: useAtlasScroll keys its re-scroll off that identity,
// and the row list depends on `rung` too.

function withRungs(prev: RungMap, updates: Iterable<[string, Rung]>): RungMap {
  let next: Map<string, Rung> | null = null;
  for (const [id, r] of updates) {
    const cur = prev.get(id) ?? DEFAULT_RUNG;
    if (cur.level === r.level && cur.dir === r.dir) continue;
    if (!next) next = new Map(prev);
    next.set(id, r);
  }
  return next ?? prev;
}

function raisedTo(prev: RungMap, ids: string[], minLevel: RungLevel): RungMap {
  let next: Map<string, Rung> | null = null;
  for (const id of ids) {
    const cur = prev.get(id) ?? DEFAULT_RUNG;
    if (cur.level >= minLevel) continue;
    if (!next) next = new Map(prev);
    next.set(id, { level: minLevel, dir: 1 });
  }
  return next ?? prev;
}

// Owns the reader's per-node rung map (see subtreeState.ts for the pendulum
// model).
export function useRungs(): {
  rung: RungMap;
  rungRef: RefObject<RungMap>;
  writeRungs: (updates: Iterable<[string, Rung]>) => void;
  revealTo: (ids: string[], minLevel: RungLevel) => void;
} {
  const [rung, setRung] = useState<RungMap>(() => new Map());
  // Latest-value ref (the idiom useBodyExpansion documents) so callers that
  // must read the current rung inside a click handler (before this render's
  // state has committed) get the up-to-date map without depending on it.
  const rungRef = useRef<RungMap>(rung);
  rungRef.current = rung;

  // Writes an arbitrary batch of rungs.
  const writeRungs = useCallback((updates: Iterable<[string, Rung]>) => {
    setRung((prev) => withRungs(prev, updates));
  }, []);

  // Navigation reveal: raises rungs to at least minLevel, monotonically, and
  // never lowers or touches an already-sufficient rung — so it can never
  // collapse a branch the user had open elsewhere. Never writes body state.
  const revealTo = useCallback((ids: string[], minLevel: RungLevel) => {
    setRung((prev) => raisedTo(prev, ids, minLevel));
  }, []);

  return { rung, rungRef, writeRungs, revealTo };
}
