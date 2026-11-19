import { ActorHeaderLinks } from "./ActorHeaderLinks";
import type { ActorProfile } from "../../lib/actorIndex";
import { ENTITY_TYPE_LABEL, ENTITY_TYPE_COLOR } from "../../lib/entityGraph";
import { UNLISTED_AGENT, agentFamily } from "@/lib/agentKinds";

export function ActorHeader({ profile }: { profile: ActorProfile }) {
  const { entity } = profile;
  const color = ENTITY_TYPE_COLOR[entity.et] ?? "var(--entity-fallback)";
  const typeLabel = entity.et === "agent" ? (agentFamily(entity.st) ?? UNLISTED_AGENT).label : (ENTITY_TYPE_LABEL[entity.et] ?? entity.et);

  return (
    <div className="mb-6">
      <p className="mono text-xs mb-1" style={{ color: "var(--tan-3)" }}>
        radar
      </p>
      <h1 className="text-xl font-semibold" style={{ color: "var(--tan)" }}>
        {entity.name}
      </h1>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span
          className="mono text-[11px] px-1.5 py-0.5 rounded"
          style={{ border: `1px solid ${color}`, color }}
        >
          {typeLabel}
        </span>
        <ActorHeaderLinks profile={profile} />
      </div>
    </div>
  );
}
