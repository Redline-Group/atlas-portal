import { SOURCE_CLASSES, normalizeSources, sourceHref, type SourceClass } from "@/lib/provenance/sources";

// The one mark for "this is not verbatim Atlas text". Atlas text is never
// marked; every other class (src/lib/provenance/sources.ts) gets this chip.
// The word sits beside the glyph so the meaning is on the page without a hover,
// and the dotted border is the rule that a solid edge is reserved for Atlas
// text. Both carry the meaning, so it survives a monochrome theme.

export type SourceMarkProps = Omit<React.ComponentProps<"a">, "href" | "title" | "children"> & {
  source: SourceClass;
  /** A glyph alone, for a lone value in a container that already explains it. */
  bare?: boolean;
  /** Extra detail after the word, such as a read time: "on-chain · read 14:02 UTC". */
  detail?: string;
  /** Extra detail in the tooltip only, for what is too long or too technical to sit on the page. */
  hint?: string;
  /** Render a plain span. Needed inside another link, where a nested anchor is invalid. */
  unlinked?: boolean;
};

const CHIP = "mono text-[10px] leading-none whitespace-nowrap no-underline";
const CHIP_BOX = "px-1.5 py-0.5 rounded border border-dotted";

export function SourceMark({ source, bare = false, detail, hint, unlinked = false, className = "", ...props }: SourceMarkProps) {
  const def = SOURCE_CLASSES[source];
  const common = {
    "data-source": source,
    title: [def.meaning, detail, hint].filter(Boolean).join(" "),
    className: `${CHIP} ${bare ? "" : CHIP_BOX} ${className}`.trim(),
    style: { color: "var(--source-mark)", borderColor: "var(--source-mark)" },
  };
  const body = bare ? (
    <>
      <span aria-hidden="true">{def.glyph}</span>
      <span className="sr-only">{def.word}</span>
    </>
  ) : (
    <>
      <span aria-hidden="true">{def.glyph}</span> {def.word}
      {detail ? ` · ${detail}` : ""}
    </>
  );
  if (unlinked) return <span {...common}>{body}</span>;
  return (
    <a {...props} {...common} href={sourceHref(source)}>
      {body}
    </a>
  );
}

export type SourceMarksProps = Omit<React.ComponentProps<"span">, "children"> & {
  sources: readonly SourceClass[];
  unlinked?: boolean;
};

/** A report's source set, in registry order. Atlas-only (empty) renders nothing. */
export function SourceMarks({ sources, unlinked, className = "", ...props }: SourceMarksProps) {
  const classes = normalizeSources(sources);
  if (classes.length === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`.trim()} {...props}>
      {classes.map((id) => (
        <SourceMark key={id} source={id} unlinked={unlinked} />
      ))}
    </span>
  );
}
