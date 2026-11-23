import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import { DEFAULT_RUNG, type Rung, type RungLevel } from "./subtreeState";

type RungMap = ReadonlyMap<string, Rung>;

// Both updaters keep the previous Map identity on no-op: useAtlasScroll keys its re-scroll off it.

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

export function useRungs(): {
  rung: RungMap;
  rungRef: RefObject<RungMap>;
  writeRungs: (updates: Iterable<[string, Rung]>) => void;
  revealTo: (ids: string[], minLevel: RungLevel) => void;
} {
  const [rung, setRung] = useState<RungMap>(() => new Map());
  const rungRef = useRef<RungMap>(rung);
  rungRef.current = rung;

  const writeRungs = useCallback((updates: Iterable<[string, Rung]>) => {
    setRung((prev) => withRungs(prev, updates));
  }, []);

  const revealTo = useCallback((ids: string[], minLevel: RungLevel) => {
    setRung((prev) => raisedTo(prev, ids, minLevel));
  }, []);

  return { rung, rungRef, writeRungs, revealTo };
}
