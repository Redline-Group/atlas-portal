import { useArrivalTarget } from "../../hooks/useArrivalTarget";
import type { ActorProfile } from "../../lib/actorIndex";
import { ActorChain } from "./ActorChain";
import { ActorHeader } from "./ActorHeader";
import { ActorSettlementTeaser } from "./ActorSettlementTeaser";
import { ActorMainColumn, ActorSideColumn, ActorWideColumn } from "./ActorColumns";
import { useSubpageAnchorForward } from "./useSubpageAnchorForward";
import { hasActorPages } from "@/lib/radarPages";

interface Props {
  profile: ActorProfile;
}

export function ActorDashboard({ profile }: Props) {
  const split = hasActorPages(profile.entity);
  useArrivalTarget(profile.entity.id);
  useSubpageAnchorForward(profile.entity.slug, profile.primitives, split);

  const { entity, chain } = profile;

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

        <ActorMainColumn profile={profile} split={split} />
        <ActorSideColumn profile={profile} split={split} />
        <ActorWideColumn profile={profile} />
      </div>
    </div>
  );
}
