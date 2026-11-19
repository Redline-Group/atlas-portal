import type { ActorProfile } from "../../lib/actorIndex";
import { ActorContact } from "./ActorContact";
import { ActorContracts } from "./ActorContracts";
import { ActorConnections } from "./ActorConnections";
import { ActorHistory } from "./ActorHistory";
import { ActorResponsibilities } from "./ActorResponsibilities";
import { ActorRewards } from "./ActorRewards";
import { Section } from "./RadarSection";
import { CompositePartySection } from "./CompositePartySection";
import { RADAR_SECTION } from "@/lib/radarAnchors";

interface Props {
  profile: ActorProfile;
  split: boolean;
}

export function ActorMainColumn({ profile, split }: Props) {
  const { entity, comprisesMembers } = profile;
  return (
    <div className="min-w-0">
      {/* Contact — governance channels + emergency response (Prime Agents) */}
      <ActorContact contact={profile.contact} />
      <ActorContracts entity={entity} />

      {entity.et === "composite_party" && <CompositePartySection members={comprisesMembers} />}
      {/* Only Primes have primitives, and a Prime's instances, history and
          PAUs are subpages (radarPages.ts). */}
      {!split && <ActorConnections profile={profile} />}
    </div>
  );
}

export function ActorSideColumn({ profile, split }: Props) {
  return (
    <aside className="min-w-0">
      {split ? (
        <ActorConnections profile={profile} />
      ) : (
        <Section
          title={"History of Doc Changes affecting " + profile.entity.name}
          id={RADAR_SECTION.history}
        >
          <ActorHistory profile={profile} />
        </Section>
      )}
    </aside>
  );
}

export function ActorWideColumn({ profile }: { profile: ActorProfile }) {
  const { adRows, rewardsAgent } = profile;
  return (
    <div className="lg:col-span-2 min-w-0">
      {adRows.length > 0 && (
        <Section title="Responsibilities" id={RADAR_SECTION.responsibilities}>
          <ActorResponsibilities rows={adRows} />
        </Section>
      )}
      {rewardsAgent && (
        <Section title="Rewards" id={RADAR_SECTION.rewards}>
          <ActorRewards agent={rewardsAgent} />
        </Section>
      )}
    </div>
  );
}
