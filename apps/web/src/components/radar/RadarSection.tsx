import type { ReactNode } from "react";
import { HEADER_OFFSET } from "../../lib/layout";

/** A Radar section's title row: the title, and beside it the mark of what the section is, when it is not Atlas text. */
export function SectionTitle({ title, mark }: { title: string; mark?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--tan-3)" }}>
        {title}
      </h2>
      {mark}
    </div>
  );
}

export function Section({
  title,
  id,
  mark,
  children,
}: {
  title: string;
  id?: string;
  /** Names what the section is when it is not Atlas text (a `SourceMark`), beside the title. */
  mark?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-8" style={id ? { scrollMarginTop: HEADER_OFFSET } : undefined}>
      <SectionTitle title={title} mark={mark} />
      {children}
    </section>
  );
}
