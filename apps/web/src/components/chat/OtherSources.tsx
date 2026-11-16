import type { ToolCallRecord } from "./api";
import { SOURCE_CLASSES } from "@/lib/provenance/sources";
import { SourceMark } from "../SourceMark";
import { LinkMark } from "./LinkMark";
import { extractOtherLinks, toolClassesUsed } from "./otherSources";

const WHAT = { preview: "preview" } as const;

/**
 * The row under the Atlas citations for everything else the answer drew on: a
 * chip per source class the turn's tools returned, then each chain, outside or
 * preview link the answer carries. Nothing when the answer used only Atlas text.
 */
export function OtherSources({ content, calls }: { content: string; calls?: readonly ToolCallRecord[] }) {
  const links = extractOtherLinks(content);
  const classes = toolClassesUsed(calls);
  const count = links.length + classes.length;
  if (count === 0) return null;
  return (
    <div className="rlc-sources" data-other-sources>
      <p className="rlc-sources-label">
        <span>other sources · {count}</span>
      </p>
      <div className="rlc-sources-chips">
        {classes.map((c) =>
          c.class === "preview" ? (
            <span key="preview" className="rlc-cite" title={`Tool results from a PR preview (${c.tools.join(", ")})`}>
              <LinkMark cls="preview" className="mr-1" />
              <span className="rlc-cite-title">{WHAT.preview}</span>
            </span>
          ) : (
            <SourceMark key={c.class} source={c.class} unlinked hint={`Tool results this turn: ${c.tools.join(", ")}. ${SOURCE_CLASSES[c.class].caveat}`} />
          ),
        )}
        {links.map((l) => (
          <a key={l.href} className="rlc-cite" href={l.href} target="_blank" rel="noopener noreferrer">
            <LinkMark cls={l.class} className="mr-1" />
            <span className="rlc-cite-title">{l.text}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
