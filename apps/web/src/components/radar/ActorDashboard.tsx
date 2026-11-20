import { useArrivalTarget } from "../../hooks/useArrivalTarget";
import type { ActorProfile } from "../../lib/actorIndex";
import { ActorAside } from "./ActorAside";
import { ActorChain } from "./ActorChain";
import { ActorContact } from "./ActorContact";
import { ActorContracts } from "./ActorContracts";
import { ActorHeader } from "./ActorHeader";
import { ActorSettlementTeaser } from "./ActorSettlementTeaser";
import { ActorConnections } from "./ActorConnections";
import { ActorSummarySections } from "./ActorSummarySections";
import { useSubpageAnchorForward } from "./useSubpageAnchorForward";
import { CompositePartySection } from "./CompositePartySection";
import { hasActorPages } from "@/lib/radarPages";

interface Props {
  profile: ActorProfile;
}

export function ActorDashboard({ profile }: Props) {
  const split = hasActorPages(profile.entity);
  useArrivalTarget(profile.entity.id);
  useSubpageAnchorForward(profile.entity.slug, profile.primitives, split);
  const { entity, chain, comprisesMembers } = profile;

  return (
    <div className="flex-1 px-6 py-6 min-w-0">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-8">
        <div className="lg:col-span-2 min-w-0 flow-root">
          {/* Floated first → top-right of the agent header; null if no MSC workbook. */}
          <ActorSettlementTeaser slug={entity.slug} />
          <ActorHeader profile={profile} />

          {/* Chain — always shown */}
          <div className="mb-6">
            <ActorChain chain={chain} currentSlug={entity.slug} />
          </div>
        </div>

        <div className="min-w-0">
          {/* Contact — governance channels + emergency response (Prime Agents) */}
          <ActorContact contact={profile.contact} />
          <ActorContracts entity={entity} />

          {entity.et === "composite_party" && <CompositePartySection members={comprisesMembers} />}
          {/* Only Primes have primitives, and a Prime's instances, history and
              PAUs are subpages (radarPages.ts). */}
          {!split && <ActorConnections profile={profile} />}
        </div>

        <ActorAside profile={profile} split={split} />
        <ActorSummarySections profile={profile} />
      </div>
    </div>
  );
}
