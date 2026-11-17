import { HEADER_OFFSET } from "../../lib/layout";
import type { SourceClass } from "@/lib/provenance/sources";
import { SourceMark } from "../SourceMark";

export function Section({
  title,
  id,
  source,
  sourceHint,
  children,
}: {
  title: string;
  id?: string;
  /** The section is not Atlas text: names its class beside the heading. */
  source?: SourceClass;
  sourceHint?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-8" style={id ? { scrollMarginTop: HEADER_OFFSET } : undefined}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--tan-3)" }}>
          {title}
        </h2>
        {source && <SourceMark source={source} bare hint={sourceHint} />}
      </div>
      {children}
    </section>
  );
}
