import type { ActorProfile } from "../../lib/actorIndex";
import { ActorResponsibilities } from "./ActorResponsibilities";
import { ActorRewards } from "./ActorRewards";
import { Section } from "./RadarSection";
import { RADAR_SECTION } from "@/lib/radarAnchors";

export type ActorSummarySectionsProps = {
  profile: ActorProfile;
};

/** The full-width row under the two columns: Responsibilities and Rewards. */
export function ActorSummarySections({ profile }: ActorSummarySectionsProps) {
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
