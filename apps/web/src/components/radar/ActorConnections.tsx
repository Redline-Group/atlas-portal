import type { ActorProfile } from "../../lib/actorIndex";
import { RADAR_SECTION } from "@/lib/radarAnchors";
import { Section } from "./RadarSection";
import { RelationRow } from "./RelationRow";
import { RecRow } from "./RecRow";
import { SourceMark } from "../SourceMark";

export interface ActorConnectionsProps {
  profile: Pick<ActorProfile, "relations" | "recommendations">;
}

/** The actor's Relationships and Notable sections; each is left out when empty. */
export function ActorConnections({ profile: { relations, recommendations } }: ActorConnectionsProps) {
  return (
    <>
      {relations.length > 0 && (
        <Section
          title="Relationships"
          id={RADAR_SECTION.relationships}
          mark={<SourceMark source="derived" bare hint="Edges the app extracted from Atlas text. Each row lists the documents it was read from." />}
        >
          {relations.map((r, i) => (
            <RelationRow key={i} r={r} />
          ))}
        </Section>
      )}
      {recommendations.length > 0 && (
        <Section
          title="Notable"
          id={RADAR_SECTION.notable}
          mark={<SourceMark source="derived" bare hint="Judgements the app computed from the relationships and documents." />}
        >
          {recommendations.map((rec, i) => (
            <RecRow key={i} rec={rec} />
          ))}
        </Section>
      )}
    </>
  );
}
