import { anchorProps } from "./PauSectionHeading";
import type { Anchor } from "@/lib/pauAnchors";
import { CopyLink } from "../CopyLink";

/** An h3 inside one of the page's parts (PauPartHeading), with its copy link. */
export function PauSubHeading({ anchor, children }: { anchor: Anchor; children: string }) {
  return (
    <div className="relative mb-2">
      <CopyLink id={anchor.id} label={children} top={3} />
      <h3 {...anchorProps(anchor)} className="mono text-[14px] uppercase tracking-wider" style={{ ...anchorProps(anchor).style, color: "var(--tan)" }}>
        {children}
      </h3>
    </div>
  );
}
