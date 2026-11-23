import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ATLAS_EMPTY_SET, type LoadedData } from "@/lib/atlasHelpers";
import { removed, toggled } from "../../lib/setOps";

export interface BodyExpansion {
  expandedSet: Set<string>;
  /** A body is open iff `expandedSet.has(id) !== userToggles.has(id)`. */
  userToggles: Set<string>;
  toggle: (nodeId: string) => void;
  setBodiesExpanded: (ids: string[], expand: boolean) => void;
}

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

export function useBodyExpansion(id: string, data: LoadedData): BodyExpansion {
  const [userToggles, setUserToggles] = useState<Set<string>>(new Set());
  useEffect(() => {
    setUserToggles((prev) => removed(prev, id));
  }, [id]);
  const toggle = useCallback((nodeId: string) => {
    setUserToggles((prev) => toggled(prev, nodeId));
  }, []);

  const expandedSet = useAutoExpanded(id, data);
  // Ref keeps setBodiesExpanded stable; churning it would re-render every row via the actions context.
  const expandedSetRef = useRef(expandedSet);
  expandedSetRef.current = expandedSet;

  // Ref read outside the updater, which StrictMode double-invokes.
  const setBodiesExpanded = useCallback((ids: string[], expand: boolean) => {
    const auto = expandedSetRef.current;
    setUserToggles((prev) => bodiesSetTo(prev, ids, expand, auto, data.atlas.docs));
  }, [data]);

  return { expandedSet, userToggles, toggle, setBodiesExpanded };
}
