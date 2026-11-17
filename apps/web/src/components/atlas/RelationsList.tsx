import { SECTION_HEAD, relationEnd, type Nav, type PanelRelation } from "./panelSections";
import { AtlasLink } from "../AtlasLink";
import { atlasHref } from "@/lib/routes";

interface RelationsListProps {
  relations: PanelRelation[];
  onNav: Nav;
  docNoToId?: Map<string, string>;
}

// The notes section's extracted relations, both directions.
export function RelationsList({ relations, onNav, docNoToId }: RelationsListProps) {
  return (
    <div className="mt-8">
      <p className={`${SECTION_HEAD} mb-3`}>relations · {relations.length}</p>
      <div className="space-y-2">
        {relations.map((rel, i) => (
          <RelationRow key={i} rel={rel} onNav={onNav} docNoToId={docNoToId} />
        ))}
      </div>
    </div>
  );
}

// One relation: its kind, an inbound arrow, the far end (a link when it has a doc),
// and the doc_nos that define it.
function RelationRow({ rel, onNav, docNoToId }: { rel: PanelRelation; onNav: Nav; docNoToId?: Map<string, string> }) {
  const { edge: e, isOut } = rel;
  const { label, navId } = relationEnd(rel);
  return (
    <div className="text-xs pb-2 border-b border-border">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="mono px-1.5 py-0.5 rounded text-[10px] bg-surface text-accent">{e.e}</span>
        {!isOut && <span className="text-[10px] mono text-gray">←</span>}
        {navId ? (
          <AtlasLink to={atlasHref(navId)} onOpen={() => onNav("relation", navId)} className="mono hover:underline text-tan-2">{label}</AtlasLink>
        ) : (
          <span className="font-medium text-tan">{label}</span>
        )}
      </div>
      {e.s && e.s.length > 0 && (
        <p className="mono text-[10px] text-tan-3">
          defined in:{" "}
          {e.s.map((docNo, j) => (
            <span key={docNo}>
              {j > 0 && ", "}
              <SourceDocLink docNo={docNo} docId={docNoToId?.get(docNo)} onNav={onNav} />
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

// A relation's defining document, named by doc_no: a link to it when the doc_no
// names a document in this atlas, plain text when it does not.
function SourceDocLink({ docNo, docId, onNav }: { docNo: string; docId?: string; onNav: Nav }) {
  if (!docId) return <span>{docNo}</span>;
  return (
    <AtlasLink to={atlasHref(docId)} onOpen={() => onNav("relation_source", docId)} className="hover:underline text-accent">
      {docNo}
    </AtlasLink>
  );
}
