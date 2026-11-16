import { Link } from "../Link";
import type { ActorRelation } from "../../lib/actorIndex";
import { edgeLabel } from "../../lib/entityGraph";
import { actorHref, atlasHref } from "@/lib/routes";
import { AtlasLink } from "../AtlasLink";

export function RelationRow({ r, docNoToId }: { r: ActorRelation; docNoToId?: ReadonlyMap<string, string> }) {
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
      <SourceDocs docNos={r.edge.s} docNoToId={docNoToId} />
    </div>
  );
}

// "from A.1.2, A.1.3": the documents the edge was extracted from, linked when
// the atlas has loaded.
function SourceDocs({ docNos, docNoToId }: { docNos?: string[]; docNoToId?: ReadonlyMap<string, string> }) {
  if (!docNos?.length) return null;
  return (
    <span className="mono text-[10px] ml-auto" style={{ color: "var(--tan-3)" }}>
      from{" "}
      {docNos.map((docNo, i) => {
        const id = docNoToId?.get(docNo);
        return (
          <span key={docNo}>
            {i > 0 && ", "}
            {id ? (
              <AtlasLink to={atlasHref(id)} className="text-accent hover:underline">{docNo}</AtlasLink>
            ) : (
              docNo
            )}
          </span>
        );
      })}
    </span>
  );
}
