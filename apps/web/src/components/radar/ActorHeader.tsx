import { Link } from "../Link";
import { AtlasLink } from "../AtlasLink";
import type { ActorProfile } from "../../lib/actorIndex";
import { ENTITY_TYPE_LABEL, ENTITY_TYPE_COLOR } from "../../lib/entityGraph";
import { atlasHref, actorHref } from "@/lib/routes";
import { UNLISTED_AGENT, agentFamily } from "@/lib/agentKinds";

export type ActorHeaderProps = {
  /** The actor whose name, type chip and defining-doc / composite links are shown. */
  profile: ActorProfile;
};

function typeLabelOf(entity: ActorProfile["entity"]): string {
  if (entity.et === "agent") return (agentFamily(entity.st) ?? UNLISTED_AGENT).label;
  return ENTITY_TYPE_LABEL[entity.et] ?? entity.et;
}

export function ActorHeader({ profile }: ActorHeaderProps) {
  const { entity, definingDoc, partOfComposite } = profile;
  const color = ENTITY_TYPE_COLOR[entity.et] ?? "var(--entity-fallback)";
  return (
    <div className="mb-6">
      <p className="mono text-xs mb-1" style={{ color: "var(--tan-3)" }}>
        radar
      </p>
      <h1 className="text-xl font-semibold" style={{ color: "var(--tan)" }}>
        {entity.name}
      </h1>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="mono text-[11px] px-1.5 py-0.5 rounded" style={{ border: `1px solid ${color}`, color }}>
          {typeLabelOf(entity)}
        </span>
        {definingDoc && (
          <AtlasLink to={atlasHref(definingDoc.id)} className="mono text-[10px] text-accent hover:underline">
            {definingDoc.doc_no} <span className="enlargen">→</span>
          </AtlasLink>
        )}
        {partOfComposite?.slug && (
          <Link
            to={actorHref(partOfComposite.slug)}
            className="mono text-[10px] text-tan-3 hover:text-accent hover:underline"
          >
            part of {partOfComposite.name} <span className="enlargen">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
