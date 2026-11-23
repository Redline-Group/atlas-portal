import type { ReactNode } from "react";
import { AtlasLink } from "../AtlasLink";
import { Link } from "../Link";
import { FacilitySubscribers, type FacilitySubscriber } from "./FacilitySubscribers";
import { StatusPill } from "../reports/RewardsCells";
import { instanceSignalParams } from "@/lib/radarRules";
import { actorPageHref, atlasHref } from "@/lib/routes";
import type { NfatFacility, NfatParams } from "@/lib/nfatFacility";
import { HEADER_OFFSET } from "../../lib/layout";
import { NfatPlumbingFigure } from "./PauNfatFacility";
import { ParamValueLine } from "./ParamValueLine";

const KEY_COLUMN_PX = 220;
const dim = { color: "var(--tan-3)" };

/** One group of a facility's stated values, as an instance card shows params. */
function ParamGroup({ title, params, hint, children }: { title: string; params: NfatParams; hint: string; children?: ReactNode }) {
  const rows = instanceSignalParams({ params });
  if (rows.length === 0 && !children) return null;
  return (
    <section className="min-w-0">
      <h4 className="mono text-[10px] uppercase tracking-wider mb-1" style={dim}>{title}</h4>
      {rows.map((p) => <ParamValueLine key={p.key} p={p} colWidth={KEY_COLUMN_PX} instanceHint={hint} />)}
      {children}
    </section>
  );
}

export interface NfatFacilityCardProps {
  facility: NfatFacility;
  halo: { slug: string; name: string };
  subscribers: FacilitySubscriber[];
  /** Whether the chain's read of its Diamond PAU is stored, so the card can link to it. */
  hasPau: boolean;
}

/** One NFAT Facility: who runs and subscribes to it, how its money moves, and what the atlas states for its terms, contract and Diamond PAU. */
export function NfatFacilityCard({ facility: f, halo, subscribers, hasPau }: NfatFacilityCardProps) {
  const hint = `${f.network ?? ""} ${f.name}`;
  return (
    <article id={`facility-${f.id}`} className="rounded p-4 mb-4" style={{ background: "var(--bg-deep)", border: "1px solid var(--border)", scrollMarginTop: HEADER_OFFSET }} data-facility={f.id}>
      <header className="flex items-center gap-2 flex-wrap mb-1">
        <h3><AtlasLink to={atlasHref(f.id)} className="text-sm hover:underline" style={{ color: "var(--tan)" }}>{f.name}</AtlasLink></h3>
        {f.status && <StatusPill s={f.status} label={`${f.status} Facility`} />}
        {f.network && <span className="mono text-[10px]" style={dim}>{f.network}</span>}
        <span className="mono text-[10px]" style={dim} title="Whether the Allocation System Primitive's List Of Approved NFAT Facilities names it">{f.approved ? "on the approved list" : "not on the approved list"}</span>
      </header>
      <p className="text-[12px] mb-3" style={{ color: "var(--tan-2)" }}>
        Run by {halo.name} through a Diamond PAU. <FacilitySubscribers subscribers={subscribers} />{" "}
        {hasPau && <Link to={actorPageHref(halo.slug, "pau")} className="text-accent hover:underline">What its contracts say on chain →</Link>}
      </p>
      <NfatPlumbingFigure scope={f.id} />
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        <ParamGroup title="Deal terms" params={f.terms} hint={hint} />
        <div className="min-w-0 flex flex-col gap-4">
          <ParamGroup title="NFAT Facility Contract" params={f.contract} hint={hint} />
          <ParamGroup title="Diamond PAU" params={f.pau} hint={hint}>
            {f.multisigs.map((m) => (
              <p key={m.id} className="mono text-[10px] py-0.5">
                <AtlasLink to={atlasHref(m.id)} className="text-accent hover:underline">{m.name}</AtlasLink>
              </p>
            ))}
          </ParamGroup>
        </div>
      </div>
    </article>
  );
}
