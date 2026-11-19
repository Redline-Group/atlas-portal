import { parseMeta } from "@/lib/meta";
import { instanceSignalParams } from "@/lib/radarRules";
import type { InstanceMeta } from "@/lib/rewardsTypes";
import type { GraphEntity } from "@/types";
import { Section } from "./RadarSection";
import { ParamValueLine } from "./ParamValueLine";

const KEY_COLUMN_PX = 260;

/** A Halo Agent's SubProxy, StarGuard and max delay, which it states on its own
 *  entity, shown as an instance card shows params; nothing for other agents,
 *  whose instances state theirs. */
export function ActorContracts({ entity }: { entity: GraphEntity }) {
  const meta = entity.st === "halo" ? parseMeta<Pick<InstanceMeta, "params">>(entity.m) : null;
  const params = meta?.params ? instanceSignalParams(meta) : [];
  if (params.length === 0) return null;
  return (
    <Section title="Contracts">
      {params.map((p) => (
        <ParamValueLine key={p.key} p={p} colWidth={KEY_COLUMN_PX} instanceHint={entity.name} />
      ))}
    </Section>
  );
}
