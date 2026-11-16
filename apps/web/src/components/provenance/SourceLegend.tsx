import { SOURCE_CLASS_IDS, SOURCE_CLASSES, sourceAnchor } from "@/lib/provenance/sources";
import { SourceMark } from "../SourceMark";

// "Reading the marks": one entry per source class, each with the element id
// the marks across the app link to (sourceHref). Derived from the registry, so
// a new class gets its entry and its anchor without editing this file.
export function SourceLegend() {
  return (
    <section id="reading-the-marks" className="mb-8">
      <h2 className="mono text-sm text-tan-3 uppercase tracking-wider mb-2">reading the marks</h2>
      <p className="text-sm mb-4" style={{ color: "var(--tan-2)" }}>
        Atlas text is never marked. Anything else the app shows carries one of these marks, with a dotted border:
        a solid rule is reserved for verbatim Atlas text. A page or table that is wholly one kind says so once,
        at the top, rather than on every value.
      </p>
      <dl className="space-y-3">
        {SOURCE_CLASS_IDS.map((id) => (
          <div key={id} id={sourceAnchor(id)} className="flex gap-4 items-baseline" style={{ scrollMarginTop: "64px" }}>
            <dt className="w-24 shrink-0">
              <SourceMark source={id} unlinked />
            </dt>
            <dd className="text-sm" style={{ color: "var(--tan-2)" }}>
              {SOURCE_CLASSES[id].meaning} {SOURCE_CLASSES[id].caveat}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
