import type { LinkClass } from "@/lib/provenance/linkClass";
import { SourceMark } from "../SourceMark";

/**
 * The mark beside a link that is not an Atlas citation. A preview keeps its own
 * Δ ("a proposed change") rather than a source class; the rest are the shared
 * source marks, unlinked because the chat is not the place to navigate away.
 */
export function LinkMark({ cls, className = "" }: { cls: LinkClass; className?: string }) {
  if (cls === "preview") {
    return (
      <span className={`mono text-[11px] ${className}`} data-source="preview" title="A proposed change in a PR preview, not the live Atlas." style={{ color: "var(--source-mark)" }}>
        <span aria-hidden="true">Δ</span>
        <span className="sr-only">preview</span>
      </span>
    );
  }
  return <SourceMark source={cls} bare unlinked className={className} />;
}
