import type { GlossaryEntry } from "../../lib/glossary";
import type { Nav } from "./panelSections";
import { PanelDocLink } from "./PanelDocLink";

// The right panel's glossary section: each term the document uses, grouped with
// every Atlas definition of it.
export function PanelGlossary({ glossaryTerms, onNav }: { glossaryTerms: GlossaryEntry[][]; onNav: Nav }) {
  return (
    <div className="space-y-4">
      {glossaryTerms.map((entries) => (
        <GlossaryGroup key={entries[0].nodeId} entries={entries} onNav={onNav} />
      ))}
    </div>
  );
}

// One term and its definitions; a group with several definitions names the
// source of each.
function GlossaryGroup({ entries, onNav }: { entries: GlossaryEntry[]; onNav: Nav }) {
  return (
    <div>
      <PanelDocLink
        docId={entries[0].nodeId}
        onOpen={() => onNav("glossary", entries[0].nodeId)}
        className="text-xs font-semibold mono mb-1 text-accent hover:underline"
      >
        {entries[0].term}
      </PanelDocLink>
      {entries.map((e, i) => (
        <div key={i} className={i > 0 ? "mt-2 pt-2 border-t border-border" : ""}>
          {entries.length > 1 && e.sourceContext && (
            <PanelDocLink
              docId={e.nodeId}
              onOpen={() => onNav("glossary_source", e.nodeId)}
              className="text-[10px] mono mb-0.5 text-tan-3 hover:text-accent block"
            >
              {e.sourceContext}
            </PanelDocLink>
          )}
          <p className="text-xs leading-relaxed text-tan-2">{e.content}</p>
        </div>
      ))}
    </div>
  );
}
