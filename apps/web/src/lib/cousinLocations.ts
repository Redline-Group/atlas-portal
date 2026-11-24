import type { AtlasNode } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import type { CousinDoc } from "./cousins";
import { MAX_COUSINS } from "./cousinRank";
import { parentDocNo, titleAt } from "./cousinTitles";

type Atlas = Pick<AtlasBundle, "docs" | "docNoToId">;
type Docs = Record<string, AtlasNode>;

const LOCATION_RE = /instance configuration document location$/i;
const ICD_RE = /instance configuration document$/i;
// The markdown link target, a doc id: "[A.6.1.1.… - … Instance Configuration Document](<uuid>)".
const LINK_RE = /\]\(([^)\s]+)\)/g;

// A primitive hub's directory entry for one instance, linking to its ICD. Most
// are titled "… Location"; one that drops the word still sits under a
// "… Directory" heading.
function isEntry(atlas: Atlas, doc: AtlasNode): boolean {
  const title = doc.title.trim();
  if (LOCATION_RE.test(title)) return true;
  return ICD_RE.test(title) && /directory$/i.test((titleAt(atlas, parentDocNo(doc.doc_no)) ?? "").trim());
}

interface LocationIndex {
  icdOf: Map<string, AtlasNode>;
  locationOf: Map<string, AtlasNode>;
}

// Entry ↔ ICD, read from the link in each entry's text; built once per atlas load.
const indexCache = new WeakMap<Docs, LocationIndex>();
function locationIndex(atlas: Atlas): LocationIndex {
  let idx = indexCache.get(atlas.docs);
  if (idx) return idx;
  idx = { icdOf: new Map(), locationOf: new Map() };
  for (const loc of Object.values(atlas.docs)) {
    if (!isEntry(atlas, loc)) continue;
    const targets = [...(loc.content ?? "").matchAll(LINK_RE)].map((m) => atlas.docs[m[1]]);
    const icd = targets.find((d) => d && d.id !== loc.id && ICD_RE.test(d.title.trim()));
    if (!icd) continue;
    idx.icdOf.set(loc.id, icd);
    if (!idx.locationOf.has(icd.id)) idx.locationOf.set(icd.id, loc);
  }
  indexCache.set(atlas.docs, idx);
  return idx;
}

/** Whether `doc` is a hub directory entry that links to its instance's ICD. */
export const isIcdLocation = (atlas: Atlas, doc: AtlasNode): boolean => locationIndex(atlas).icdOf.has(doc.id);

/**
 * Cousins of an ICD Location doc: the Location docs of the cousins of the ICD it
 * points at, in that ICD list's order (the titles differ only by "Location").
 * `cousinsOf` must return the ICD's whole ranked list: the cap applies after
 * cousins without a Location doc drop out.
 */
export function locationCousins(atlas: Atlas, target: AtlasNode, cousinsOf: (id: string) => CousinDoc[]): CousinDoc[] {
  const { icdOf, locationOf } = locationIndex(atlas);
  const icd = icdOf.get(target.id);
  if (!icd) return [];
  const found = cousinsOf(icd.id).flatMap((c) => {
    const loc = locationOf.get(c.node.id);
    return loc && loc.id !== target.id ? [{ ...c, node: loc }] : [];
  });
  return found.slice(0, MAX_COUSINS);
}
