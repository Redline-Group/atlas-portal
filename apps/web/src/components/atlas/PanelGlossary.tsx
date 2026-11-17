import { SourceMark } from "../SourceMark";
import type { GlossaryEntry } from "../../lib/glossary";
import type { Nav } from "./panelSections";
import { AtlasLink } from "../AtlasLink";
import { atlasHref } from "@/lib/routes";

// The right panel's glossary section: each term the document uses, grouped with
// every Atlas definition of it.
export function PanelGlossary({ glossaryTerms, onNav }: { glossaryTerms: GlossaryEntry[][]; onNav: Nav }) {
  return (
    <div className="space-y-4">
      <p className="mono text-[10px] text-tan-3 flex flex-wrap items-center gap-2">
        <SourceMark source="derived" bare hint="Each definition is the Atlas's own. The app attaches it to a term by matching this document's text, so a term may be matched loosely." />
        terms matched in this document
      </p>
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
      <AtlasLink
        to={atlasHref(entries[0].nodeId)}
        onOpen={() => onNav("glossary", entries[0].nodeId)}
        className="text-xs font-semibold mono mb-1 text-accent hover:underline"
      >
        {entries[0].term}
      </AtlasLink>
      {entries.map((e, i) => (
        <div key={i} className={i > 0 ? "mt-2 pt-2 border-t border-border" : ""}>
          {entries.length > 1 && e.sourceContext && (
            <AtlasLink
              to={atlasHref(e.nodeId)}
              onOpen={() => onNav("glossary_source", e.nodeId)}
              className="text-[10px] mono mb-0.5 text-tan-3 hover:text-accent block"
            >
              {e.sourceContext}
            </AtlasLink>
          )}
          <p className="text-xs leading-relaxed text-tan-2">{e.content}</p>
        </div>
      ))}
    </div>
  );
}
