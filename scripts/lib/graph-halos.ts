// Sky Core Halos: Halo Agents the Core Council controls directly. They have no
// Agent Artifact. Each is a child of the Governance Scope's "List Of Sky Core
// Halos" document, and states its contracts in children titled "<Halo> <Param>"
// ("Test Halo StarGuard Contract"), so the halo's name is stripped before the
// instance param walk reads them under the keys an Agent Creation instance uses.
import { slugify } from "./graph-patterns.mjs";
import { extractParamsFromRoot } from "./graph-instances.mjs";

const LIST_TITLE_RE = /^List Of Sky Core Halos$/i;
const HALO_SECTION_RE = /\bSky Core Halos?\b/i;
export const SKY_CORE_HALO_SOURCE = "sky_core_halo";

interface Doc {
  id: string;
  doc_no: string;
  title: string;
  content?: string;
}
type Children = Map<string, Doc[]>;
type Params = Record<string, [string, string, string]>;
type AddEntity = (slug: string, name: string, type: string, subtype: string, docId: string, meta: object) => { id: string };

/** The halo's subtree with "<Halo> " dropped from each title, as a children index. */
function unprefixedSubtree(halo: Doc, childrenByDocNo: Children): Children {
  const out: Children = new Map();
  const pending = [halo];
  while (pending.length) {
    const doc = pending.shift()!;
    const kids = childrenByDocNo.get(doc.doc_no) ?? [];
    const strip = (title: string) => (title.startsWith(`${halo.title} `) ? title.slice(halo.title.length + 1) : title);
    out.set(doc.doc_no, kids.map((k) => ({ ...k, title: strip(k.title) })));
    pending.push(...kids);
  }
  return out;
}

/** Params a Sky Core Halo states: SubProxy Account, StarGuard Contract, StarGuard Max Delay. */
export function skyCoreHaloParams(halo: Doc, childrenByDocNo: Children): Params {
  return extractParamsFromRoot(halo, unprefixedSubtree(halo, childrenByDocNo)) as Params;
}

/** Every Sky Core Halo document: the children of each list document. */
export function skyCoreHaloDocs(allDocs: Doc[], childrenByDocNo: Children): Doc[] {
  return allDocs.filter((d) => LIST_TITLE_RE.test(d.title)).flatMap((list) => childrenByDocNo.get(list.doc_no) ?? []);
}

/** Adds one agent/halo entity per Sky Core Halo, keyed by its document's UUID. Returns how many. */
export function addSkyCoreHalos(allDocs: Doc[], childrenByDocNo: Children, addEntity: AddEntity): number {
  const halos = skyCoreHaloDocs(allDocs, childrenByDocNo);
  for (const d of halos) {
    const meta = { source: SKY_CORE_HALO_SOURCE, source_doc_no: d.doc_no, params: skyCoreHaloParams(d, childrenByDocNo) };
    addEntity(slugify(d.title), d.title, "agent", "halo", d.id, meta).id = d.id;
  }
  if (halos.length === 0 && allDocs.some((d) => HALO_SECTION_RE.test(d.title)))
    console.warn("  [drift] tripwire: the atlas has Sky Core Halo documents but no halo was listed — halo entities and their contract edges will be empty (list title in scripts/lib/graph-halos.ts likely renamed)");
  return halos.length;
}
