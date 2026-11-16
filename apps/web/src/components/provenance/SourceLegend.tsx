import { SOURCE_CLASS_IDS, SOURCE_CLASSES, sourceAnchor } from "@/lib/provenance/sources";
import { SOURCE_SURFACES, type SourceSurface } from "@/lib/provenance/surfaces";
import { SourceMark } from "../SourceMark";

const dim = { color: "var(--tan-3)" };

// One surface under its class: what it is, where it comes from, how current it
// is, and where a reader meets it.
function Surface({ s }: { s: SourceSurface }) {
  return (
    <li className="space-y-0.5">
      <p style={{ color: "var(--tan)" }}>{s.name}</p>
      <p>{s.from}</p>
      <p style={dim}>
        <span className="mono">current:</span> {s.fresh}
      </p>
      <p style={dim}>
        <span className="mono">seen in:</span> {s.where}
      </p>
    </li>
  );
}

// "Reading the marks": one entry per source class, each with the element id
// the marks across the app link to (sourceHref) and the surfaces that carry it.
// Derived from the registries, so a new class or surface needs no edit here.
export function SourceLegend() {
  return (
    <section id="reading-the-marks" className="mb-8">
      <h2 className="mono text-sm text-tan-3 uppercase tracking-wider mb-2">reading the marks</h2>
      <p className="text-sm mb-4" style={{ color: "var(--tan-2)" }}>
        Atlas text is never marked. Anything else the app shows carries one of these marks, with a dotted border:
        a solid rule is reserved for verbatim Atlas text. A page or table that is wholly one kind says so once,
        at the top, rather than on every value. Under each mark are the places the app uses it.
      </p>
      <dl className="space-y-6">
        {SOURCE_CLASS_IDS.map((id) => (
          <div key={id} id={sourceAnchor(id)} style={{ scrollMarginTop: "64px" }}>
            <dt className="mb-1">
              <SourceMark source={id} unlinked />
            </dt>
            <dd className="text-sm" style={{ color: "var(--tan-2)" }}>
              <p className="mb-2">
                {SOURCE_CLASSES[id].meaning} {SOURCE_CLASSES[id].caveat}
              </p>
              <ul className="space-y-3 pl-4 border-l border-dotted border-[var(--border)]">
                {SOURCE_SURFACES[id].map((s) => (
                  <Surface key={s.name} s={s} />
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
