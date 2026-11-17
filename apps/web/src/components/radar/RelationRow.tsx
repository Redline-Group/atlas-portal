import { Link } from "../Link";
import type { ActorRelation } from "../../lib/actorIndex";
import { edgeLabel } from "../../lib/entityGraph";
import { actorHref, atlasHref } from "@/lib/routes";
import { AtlasLink } from "../AtlasLink";

export function RelationRow({ r }: { r: ActorRelation }) {
  const label = edgeLabel(r.edge.e, r.direction);
  const arrow = r.direction === "outbound" ? "→" : "←";
  return (
    <div className="flex items-center gap-2 py-1 border-t border-[var(--border)] text-sm">
      <span className="mono text-[10px]" style={{ color: "var(--tan-3)" }}>
        <span className="enlargen">{arrow}</span> {label}
      </span>
      {r.otherSlug ? (
        <Link to={actorHref(r.otherSlug)} className="text-accent hover:underline">
          {r.otherLabel}
        </Link>
      ) : (
        <span style={{ color: "var(--tan-2)" }}>{r.otherLabel}</span>
      )}
      <SourceDocs docs={r.sourceDocs} />
    </div>
  );
}

// "from A.1.2, A.1.3": the documents the edge was extracted from, linked when
// the profile resolved them.
function SourceDocs({ docs }: { docs: ActorRelation["sourceDocs"] }) {
  if (docs.length === 0) return null;
  return (
    <span className="mono text-[10px] ml-auto" style={{ color: "var(--tan-3)" }}>
      from{" "}
      {docs.map(({ docNo, id }, i) => (
        <span key={docNo}>
          {i > 0 && ", "}
          {id ? (
            <AtlasLink to={atlasHref(id)} className="text-accent hover:underline">{docNo}</AtlasLink>
          ) : (
            docNo
          )}
        </span>
      ))}
    </span>
  );
}
