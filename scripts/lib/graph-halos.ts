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
type AddEntity = (slug: string, name: string, type: string, subtype: string, docId: string, meta: object) => { id: string; subtype: string | null; defining_doc_id: string | null };

/** The children index with "<Halo> " dropped from each title the param walk reads. */
function unprefixed(halo: Doc, childrenByDocNo: Children): Children {
  const prefix = `${halo.title} `;
  const get = (docNo: string) => childrenByDocNo.get(docNo)?.map((k) => (k.title.startsWith(prefix) ? { ...k, title: k.title.slice(prefix.length) } : k));
  return { get } as Children; // the param walk only reads `get`
}

/** Params a Sky Core Halo states: SubProxy Account, StarGuard Contract, StarGuard Max Delay. */
export function skyCoreHaloParams(halo: Doc, childrenByDocNo: Children): Params {
  return extractParamsFromRoot(halo, unprefixed(halo, childrenByDocNo)) as Params;
}

const CONTRACT_KEY_RE = /^(SubProxy Account|StarGuard Contract)\b/;

/** Each Sky Core Halo with its params: a child of a list document that states a halo's contracts. */
export function skyCoreHalos(allDocs: Doc[], childrenByDocNo: Children): { doc: Doc; params: Params }[] {
  const listed = allDocs.filter((d) => LIST_TITLE_RE.test(d.title)).flatMap((list) => childrenByDocNo.get(list.doc_no) ?? []);
  return listed.flatMap((doc) => {
    const params = skyCoreHaloParams(doc, childrenByDocNo);
    if (Object.keys(params).some((k) => CONTRACT_KEY_RE.test(k))) return [{ doc, params }];
    console.warn(`  [drift] Sky Core Halo list child "${doc.title}" (${doc.doc_no}) states no SubProxy Account or StarGuard Contract; not read as a halo`);
    return [];
  });
}

/** Adds one agent/halo entity per Sky Core Halo, keyed by its document's UUID. Returns how many. */
export function addSkyCoreHalos(allDocs: Doc[], childrenByDocNo: Children, addEntity: AddEntity): number {
  const halos = skyCoreHalos(allDocs, childrenByDocNo);
  for (const { doc, params } of halos) {
    const meta = { source: SKY_CORE_HALO_SOURCE, source_doc_no: doc.doc_no, params };
    let entity = addEntity(slugify(doc.title), doc.title, "agent", "halo", doc.id, meta);
    // addEntity hands back the entity already holding the slug; a halo sharing another entity's name takes its own.
    if (entity.defining_doc_id !== doc.id || entity.subtype !== "halo") {
      console.warn(`  [drift] Sky Core Halo "${doc.title}" (${doc.doc_no}) shares its name with another entity; added under the slug ${slugify(doc.title)}-halo`);
      entity = addEntity(`${slugify(doc.title)}-halo`, doc.title, "agent", "halo", doc.id, meta);
    }
    entity.id = doc.id;
  }
  if (!allDocs.some((d) => LIST_TITLE_RE.test(d.title)) && allDocs.some((d) => HALO_SECTION_RE.test(d.title)))
    console.warn("  [drift] tripwire: the atlas has Sky Core Halo documents but no list of them — halo entities and their contract edges will be empty (list title in scripts/lib/graph-halos.ts likely renamed)");
  return halos.length;
}
