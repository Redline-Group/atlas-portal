import type { ComponentProps, CSSProperties } from "react";
import { SOURCE_CLASSES, normalizeSources, sourceHref, type SourceClass } from "@/lib/provenance/sources";
import { Link } from "./Link";
import { MARK_COLOR, MARK_TEXT } from "./markStyle";

// The one mark for "this is not verbatim Atlas text". Atlas text is never
// marked; every other class (src/lib/provenance/sources.ts) gets this chip.
// The word sits beside the glyph so the meaning is on the page without a hover,
// and the dotted border is the rule that a solid edge is reserved for Atlas
// text. Both carry the meaning, so it survives a monochrome theme.

interface SourceMarkShape {
  source: SourceClass;
  /** A glyph alone, for a lone value in a container that already explains it. */
  bare?: boolean;
  /** The glyph and the word without the dotted outline, for a mark that sits in a corner of a small card. */
  plain?: boolean;
  /** A short fact shown after the word, such as a read time. A sentence belongs in `hint`. */
  detail?: string;
  /** Extra detail in the tooltip only, for what is too long or too technical to sit on the page. */
  hint?: string;
}

type LinkedMarkProps = SourceMarkShape & { unlinked?: false } & Omit<ComponentProps<"a">, "href" | "title" | "children">;

/** A plain span, needed inside another link, where a nested anchor is invalid; it takes span props, not anchor props. */
type UnlinkedMarkProps = SourceMarkShape & { unlinked: true } & Omit<ComponentProps<"span">, "title" | "children">;

export type SourceMarkProps = LinkedMarkProps | UnlinkedMarkProps;

const CHIP_BOX = "px-1.5 py-0.5 rounded border border-dotted";

/** What the element is made of, whichever tag it takes: the caller's own props go first and these win, except `style`, which is merged. */
function markAttrs({ source, bare = false, plain = false, detail, hint, className = "", style }: SourceMarkShape & { className?: string; style?: CSSProperties }) {
  return {
    "data-source": source,
    title: [SOURCE_CLASSES[source].meaning, detail, hint].filter(Boolean).join(" "),
    className: `${MARK_TEXT} ${bare || plain ? "" : CHIP_BOX} ${className}`.trim(),
    style: { color: MARK_COLOR, borderColor: MARK_COLOR, ...style },
  };
}

function MarkBody({ source, bare = false, detail }: SourceMarkShape) {
  const def = SOURCE_CLASSES[source];
  if (bare) {
    return (
      <>
        <span aria-hidden="true">{def.glyph}</span>
        <span className="sr-only">{def.word}</span>
      </>
    );
  }
  return (
    <>
      <span aria-hidden="true">{def.glyph}</span> {def.word}
      {detail ? ` · ${detail}` : ""}
    </>
  );
}

/**
 * Every prop this component reads itself. Typed as a Record over the shape's
 * keys, so a prop added to SourceMarkShape without an entry here fails to
 * compile instead of leaking onto the DOM element.
 */
const OWN_PROPS: Record<keyof SourceMarkShape | "unlinked", true> = { source: true, bare: true, plain: true, detail: true, hint: true, unlinked: true };

/** The caller's own props, without the ones this component reads. */
function passThrough(props: object): Record<string, unknown> {
  const rest = { ...props } as Record<string, unknown>;
  for (const k of Object.keys(OWN_PROPS)) delete rest[k];
  return rest;
}

export function SourceMark(props: SourceMarkProps) {
  const attrs = markAttrs(props);
  const body = <MarkBody source={props.source} bare={props.bare} detail={props.detail} />;
  if (props.unlinked) {
    return (
      <span {...(passThrough(props) as ComponentProps<"span">)} {...attrs}>
        {body}
      </span>
    );
  }
  // An inline symbol sits next to data the reader is reading: its legend entry opens beside the page, not over it.
  const away = props.bare || props.plain ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Link {...away} {...(passThrough(props) as Omit<ComponentProps<"a">, "href">)} {...attrs} to={sourceHref(props.source)}>
      {body}
    </Link>
  );
}

export type SourceMarksProps = Omit<ComponentProps<"span">, "children"> & {
  sources: readonly SourceClass[];
  unlinked?: boolean;
};

/** A report's source set, in registry order. Atlas-only (empty) renders nothing. */
export function SourceMarks({ sources, unlinked, className = "", ...props }: SourceMarksProps) {
  const classes = normalizeSources(sources);
  if (classes.length === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`.trim()} {...props}>
      {classes.map((id) => (unlinked ? <SourceMark key={id} source={id} unlinked /> : <SourceMark key={id} source={id} />))}
    </span>
  );
}
