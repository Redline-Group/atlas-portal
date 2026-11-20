import type { ActorProfile } from "../../lib/actorIndex";
import { ActorConnections } from "./ActorConnections";
import { ActorHistory } from "./ActorHistory";
import { Section } from "./RadarSection";
import { RADAR_SECTION } from "@/lib/radarAnchors";

export type ActorAsideProps = {
  profile: ActorProfile;
  /** The actor has subpages (radarPages.ts): its history is one of them, so
   *  the aside carries its connections instead. */
  split: boolean;
};

export function ActorAside({ profile, split }: ActorAsideProps) {
  return (
    <aside className="min-w-0">
      {split ? (
        <ActorConnections profile={profile} />
      ) : (
        <Section title={"History of Doc Changes affecting " + profile.entity.name} id={RADAR_SECTION.history}>
          <ActorHistory profile={profile} />
        </Section>
      )}
    </aside>
  );
}
