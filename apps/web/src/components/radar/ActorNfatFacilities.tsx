import { useMemo } from "react";
import { useLoaded } from "../../hooks/useAtlasData";
import { loadGraph } from "../../lib/graph";
import { loadPau, snapshotsForPrime } from "../../lib/pau";
import { facilityIndex, facilitySubscribers, haloFacilities } from "@/lib/nfatFacilities";
import type { GraphEntity } from "@/types";
import { Section } from "./RadarSection";
import { NfatFacilityCard } from "./NfatFacilityCard";

/** A Halo Agent's NFAT Facilities, one card each; nothing for an agent that lists none. */
export function ActorNfatFacilities({ entity }: { entity: GraphEntity }) {
  const facilities = useMemo(() => haloFacilities(entity), [entity]);
  const graph = useLoaded(loadGraph, { soft: true });
  const pau = useLoaded(loadPau, { soft: true });
  const index = useMemo(() => facilityIndex([entity]), [entity]);
  const primeByDoc = useMemo(() => new Map((graph?.participants ?? []).flatMap((p) => (p.did ? [[p.did, p] as const] : []))), [graph]);
  if (facilities.length === 0) return null;
  const hasPau = !!pau && snapshotsForPrime(pau, entity.id).length > 0;
  return (
    <div className="lg:col-span-2 min-w-0">
      <Section title="NFAT Facilities" id="nfat-facilities">
        {facilities.map((f) => {
          const subscribers = facilitySubscribers(graph?.instances ?? [], f, index).map((s) => {
            const prime = s.primeDocId ? primeByDoc.get(s.primeDocId) : undefined;
            return { instanceId: s.instanceId, instanceName: s.instanceName, prime: prime ? { slug: prime.slug, name: prime.name } : null };
          });
          return <NfatFacilityCard key={f.id} facility={f} halo={entity} subscribers={subscribers} hasPau={hasPau} />;
        })}
      </Section>
    </div>
  );
}
