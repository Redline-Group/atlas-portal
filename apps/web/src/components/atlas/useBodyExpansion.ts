import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ATLAS_EMPTY_SET, type LoadedData } from "@/lib/atlasHelpers";
import { removed, toggled } from "../../lib/setOps";

export interface BodyExpansion {
  /** Docs whose body opens on its own: every doc navigated to so far. */
  expandedSet: Set<string>;
  /** Docs the user flipped away from that default. A body is open iff
   *  `expandedSet.has(id) !== userToggles.has(id)`. */
  userToggles: Set<string>;
  toggle: (nodeId: string) => void;
  /** Bulk body writer: forces every listed doc that has content open/closed. */
  setBodiesExpanded: (ids: string[], expand: boolean) => void;
}

// target: isExpanded (= auto XOR toggled) === expand
function bodiesSetTo(
  prev: Set<string>,
  ids: string[],
  expand: boolean,
  auto: Set<string>,
  docs: LoadedData["atlas"]["docs"],
): Set<string> {
  const next = new Set(prev);
  for (const nid of ids) {
    if (!docs[nid]?.content) continue;
    const isAuto = auto.has(nid);
    if ((expand && isAuto) || (!expand && !isAuto)) next.delete(nid);
    else next.add(nid);
  }
  return next;
}

function useAutoExpanded(id: string, data: LoadedData): Set<string> {
  const seenExpanded = useRef<Set<string>>(new Set());
  return useMemo(() => {
    if (!id) return ATLAS_EMPTY_SET;
    if (!data.atlas.docs[id]) return new Set(seenExpanded.current);
    seenExpanded.current.add(id);
    return new Set(seenExpanded.current);
  }, [data, id]);
}

// Which doc bodies are open in the reader: the navigated-to docs open on their
// own, and the user's toggles flip individual docs away from that. Navigating
// to a doc clears its toggle, so arriving always shows the body.
export function useBodyExpansion(id: string, data: LoadedData): BodyExpansion {
  const [userToggles, setUserToggles] = useState<Set<string>>(new Set());
  useEffect(() => {
    setUserToggles((prev) => removed(prev, id));
  }, [id]);
  const toggle = useCallback((nodeId: string) => {
    setUserToggles((prev) => toggled(prev, nodeId));
  }, []);

  const expandedSet = useAutoExpanded(id, data);
  // expandedSet gets a fresh identity on every navigation; read it through a ref
  // so setBodiesExpanded stays referentially stable — it feeds the pendulum
  // and thus the actions-context object — if it churned per navigation, every
  // CollapsibleNode (a context consumer) would re-render on each doc click.
  const expandedSetRef = useRef(expandedSet);
  expandedSetRef.current = expandedSet;

  // One setUserToggles call for a whole level of children at once.
  // expandedSetRef is read HOISTED OUTSIDE the updater (StrictMode
  // double-invokes it; see main.tsx) — looping the per-node toggle over a
  // Scope's ~1,540 ids would otherwise allocate 1,540 growing Sets.
  const setBodiesExpanded = useCallback((ids: string[], expand: boolean) => {
    const auto = expandedSetRef.current;
    setUserToggles((prev) => bodiesSetTo(prev, ids, expand, auto, data.atlas.docs));
  }, [data]);

  return { expandedSet, userToggles, toggle, setBodiesExpanded };
}
