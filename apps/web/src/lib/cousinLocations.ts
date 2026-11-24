import type { AtlasNode } from "@/types";
import type { CousinDoc } from "./cousins";
import { MAX_COUSINS } from "./cousinRank";

type Docs = Record<string, AtlasNode>;

// A primitive hub's directory entry for one instance, which links to its ICD.
const LOCATION_RE = /instance configuration document location$/i;
const ICD_RE = /instance configuration document$/i;
// The markdown link target, a doc id: "[A.6.1.1.… - … Instance Configuration Document](<uuid>)".
const LINK_RE = /\]\(([^)\s]+)\)/g;

export const isIcdLocation = (doc: AtlasNode): boolean => LOCATION_RE.test(doc.title.trim());

interface LocationIndex {
  icdOf: Map<string, AtlasNode>;
  locationOf: Map<string, AtlasNode>;
}

// Location ↔ ICD, read from the link in each Location doc's text; built once per atlas load.
const indexCache = new WeakMap<Docs, LocationIndex>();
function locationIndex(docs: Docs): LocationIndex {
  let idx = indexCache.get(docs);
  if (idx) return idx;
  idx = { icdOf: new Map(), locationOf: new Map() };
  for (const loc of Object.values(docs)) {
    if (!isIcdLocation(loc)) continue;
    const targets = [...(loc.content ?? "").matchAll(LINK_RE)].map((m) => docs[m[1]]);
    const icd = targets.find((d) => d && ICD_RE.test(d.title.trim()));
    if (!icd) continue;
    idx.icdOf.set(loc.id, icd);
    if (!idx.locationOf.has(icd.id)) idx.locationOf.set(icd.id, loc);
  }
  indexCache.set(docs, idx);
  return idx;
}

/**
 * Cousins of an ICD Location doc: the Location docs of the cousins of the ICD it
 * points at, in that ICD list's order (the titles differ only by "Location").
 * `cousinsOf` must return the ICD's whole ranked list: the cap applies after
 * cousins without a Location doc drop out.
 */
export function locationCousins(docs: Docs, target: AtlasNode, cousinsOf: (id: string) => CousinDoc[]): CousinDoc[] {
  const { icdOf, locationOf } = locationIndex(docs);
  const icd = icdOf.get(target.id);
  if (!icd) return [];
  const found = cousinsOf(icd.id).flatMap((c) => {
    const loc = locationOf.get(c.node.id);
    return loc && loc.id !== target.id ? [{ ...c, node: loc }] : [];
  });
  return found.slice(0, MAX_COUSINS);
}
