import { NFAT_PLUMBING } from "@/lib/pauPlumbing";
import { plumbingLinkCss } from "@/lib/pauPlumbingLinks";
import { nfatFacilityFacts } from "@/lib/nfatFacilityFacts";
import type { Anchor } from "@/lib/pauAnchors";
import type { StoredPauSnapshot } from "../../lib/pau";
import { PauSectionHeading } from "./PauSectionHeading";
import { PlumbingKey } from "./PauPlumbingKey";
import { PlumbingSvg } from "./PauPlumbingSvg";

/** The NFAT Facility's money cycle, as a figure with its key. It reads no data. */
export function NfatPlumbingFigure({ scope }: { scope: string }) {
  return (
    <figure>
      <div className="overflow-x-auto">
        <PlumbingSvg plumbing={NFAT_PLUMBING} scope={`${NFAT_PLUMBING.id}-${scope}`} />
      </div>
      <figcaption className="mt-2 text-[12px]" style={{ color: "var(--tan-3)" }}>
        <PlumbingKey plumbing={NFAT_PLUMBING} />
      </figcaption>
    </figure>
  );
}

/**
 * On a deployment that runs an NFAT Facility: what the facility contract
 * answers about itself, then the facility's money cycle. Nothing for any other
 * deployment.
 */
export function PauNfatFacility({ snap, anchor }: { snap: StoredPauSnapshot; anchor: Anchor }) {
  const facts = nfatFacilityFacts(snap);
  if (!facts) return null;
  return (
    <section className="mt-3" data-plumbing="nfat">
      <PauSectionHeading deployment={anchor} section="nfat-facility">How the NFAT Facility works</PauSectionHeading>
      <style>{plumbingLinkCss(NFAT_PLUMBING)}</style>
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 mono text-[11px]" style={{ color: "var(--tan-2)" }}>
        {facts.map((f) => (
          <li key={f.label} data-fact={f.label} title={f.why}>
            <span style={{ color: "var(--tan-3)" }}>{f.label}</span> <span style={f.warn ? { color: "var(--accent)" } : undefined}>{f.value}</span>
          </li>
        ))}
      </ul>
      <NfatPlumbingFigure scope={anchor.id} />
    </section>
  );
}
