// NFAT Facilities as Radar reads them from the graph: each Halo's facilities
// (its entity's `nfat_facilities`), which facility an instance's params point
// at, and which Prime instances subscribe to a facility. An instance names its
// facility by linking the facility's documents ("specified in [… - NFAT
// Facility Contract Address](uuid)"), so the link's UUID is the join. Pure.
import { parseMeta } from "./meta.ts";
import type { HaloFacilitiesMeta, NfatFacility } from "./nfatFacility.ts";
import type { InstanceMeta } from "./rewardsTypes.ts";
import type { GraphEntity } from "../types.ts";

export interface FacilityRef {
  facility: NfatFacility;
  halo: Pick<GraphEntity, "id" | "slug" | "name">;
}

const UUID_LINK_RE = /\]\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/gi;

/** The facilities a Halo Agent's entity states; none for any other entity. */
export const haloFacilities = (e: Pick<GraphEntity, "st" | "m">): NfatFacility[] => (e.st === "halo" ? parseMeta<HaloFacilitiesMeta>(e.m)?.nfat_facilities ?? [] : []);

const groups = (f: NfatFacility) => [f.terms, f.contract, f.pau];

/** Every facility by each document that is part of it: its own, and the source of each of its params. */
export function facilityIndex(entities: Pick<GraphEntity, "id" | "slug" | "name" | "st" | "m">[]): Map<string, FacilityRef> {
  const out = new Map<string, FacilityRef>();
  for (const halo of entities) {
    for (const facility of haloFacilities(halo)) {
      const ref = { facility, halo: { id: halo.id, slug: halo.slug, name: halo.name } };
      const docs = [facility.id, ...groups(facility).flatMap((g) => Object.values(g).map((t) => t[1]))];
      for (const doc of docs) if (doc) out.set(doc, ref);
    }
  }
  return out;
}

/** The facility a set of param values points at: the first one a value links a document of. */
export function linkedFacility(values: string[], index: Map<string, FacilityRef>): FacilityRef | null {
  for (const v of values) for (const m of v.matchAll(UUID_LINK_RE)) if (index.has(m[1].toLowerCase())) return index.get(m[1].toLowerCase())!;
  return null;
}

/** The Prime instances whose params point at the facility, each with its Prime's document. */
export function facilitySubscribers(instances: Pick<GraphEntity, "id" | "name" | "m">[], facility: NfatFacility, index: Map<string, FacilityRef>) {
  return instances.flatMap((i) => {
    const meta = parseMeta<InstanceMeta>(i.m);
    const ref = meta?.params ? linkedFacility(Object.values(meta.params).map((t) => t[0]), index) : null;
    return ref?.facility.id === facility.id ? [{ instanceId: i.id, instanceName: i.name, primeDocId: meta!.agent_doc_id }] : [];
  });
}

/** A facility's stated value by a key's ending ("Contract Address", "name"); null when it states none. */
export function facilityValue(f: NfatFacility, group: "terms" | "contract" | "pau", keyEnd: string): string | null {
  const hit = Object.entries(f[group]).find(([k]) => k.toLowerCase().endsWith(keyEnd.toLowerCase()));
  return hit ? hit[1][0] : null;
}
