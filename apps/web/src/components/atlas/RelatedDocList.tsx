import { useCallback, type ReactNode } from "react";
import type { AtlasNode } from "@/types";
import { RelatedNode } from "../RelatedNode";
import { SECTION_HEAD, type Nav } from "./panelSections";
import { SourceMark } from "../SourceMark";
import type { SourceClass } from "@/lib/provenance/sources";

interface RelatedDocListProps {
  label: string;
  /** One-line explanation under the heading. */
  blurb?: string;
  /** The list is not Atlas text: its class, with what it means here, beside the heading. */
  source?: { class: SourceClass; hint: string };
  /** Analytics kind for navigation from these cards. */
  kind: string;
  items: { node: AtlasNode; eyebrow?: ReactNode }[];
  onNav: Nav;
  selectable?: boolean;
  byParent?: Map<string | null, AtlasNode[]>;
  className?: string;
  listClassName?: string;
}

// A counted heading over related-document cards. RelatedNode is memoized, so the
// list hands every card one stable, kind-tagged callback.
export function RelatedDocList({ label, blurb, source, kind, items, onNav, selectable, byParent, className, listClassName }: RelatedDocListProps) {
  const navigate = useCallback((nid: string) => onNav(kind, nid), [onNav, kind]);
  return (
    <section className={className}>
      <p className={`${SECTION_HEAD} ${blurb ? "mb-2" : "mb-4"} flex items-center gap-2`}>
        {label} · {items.length}
        {source && <SourceMark source={source.class} bare hint={source.hint} />}
      </p>
      {blurb && <p className="text-xs leading-relaxed mb-4 text-tan-3">{blurb}</p>}
      <div className={listClassName}>
        {items.map(({ node, eyebrow }) => (
          <RelatedNode key={node.id} node={node} eyebrow={eyebrow} onNavigate={navigate} selectable={selectable} byParent={byParent} />
        ))}
      </div>
    </section>
  );
}
