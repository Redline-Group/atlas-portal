// The source classes: everything the app shows that is not verbatim Atlas text
// falls into one of these five. Atlas text is the unmarked default, so it has
// no class. The glyph, the word, the tooltip, the /provenance anchor and the
// CSV label are all derived from this one table; nothing else spells them out.
//
// Previews keep their own "+ Δ" language and are deliberately not a class here:
// a preview marks a proposed change to the Atlas, not a different kind of data.

export const SOURCE_CLASS_IDS = ["onchain", "external", "derived", "ai", "curated"] as const;

export type SourceClass = (typeof SOURCE_CLASS_IDS)[number];

export interface SourceClassDef {
  id: SourceClass;
  /** One glyph per class; the word carries the meaning where space allows. */
  glyph: string;
  /** The word shown beside the glyph. */
  word: string;
  /** What the class means, in a sentence; the tooltip and the /provenance legend. */
  meaning: string;
  /** What the class makes no promise about; the second sentence of the CSV preamble. */
  caveat: string;
}

export const SOURCE_CLASSES: Record<SourceClass, SourceClassDef> = {
  onchain: {
    id: "onchain",
    glyph: "⬡",
    word: "on-chain",
    meaning: "Read from a contract or event log. Always carries a read time.",
    caveat: "As of the read time, not the Atlas commit.",
  },
  external: {
    id: "external",
    glyph: "⧉",
    word: "external",
    meaning: "Someone else's record: Soter workbooks, the vote portal, GitHub, chainlog or Etherscan.",
    caveat: "Not Atlas text, and only as current as its last fetch.",
  },
  derived: {
    id: "derived",
    glyph: "∴",
    word: "derived",
    meaning: "Redline's reading of the Atlas: extraction, graph edges, classification or computed values.",
    caveat: "Our reading of the Atlas, not what the Atlas says.",
  },
  ai: {
    id: "ai",
    glyph: "✳",
    word: "AI",
    meaning: "Written or judged by a model.",
    caveat: "Model output; a starting point, not a verdict.",
  },
  curated: {
    id: "curated",
    glyph: "✎",
    word: "curated",
    meaning: "Hand-maintained by Redline: the process inventory, the PAU registry, analyst notes.",
    caveat: "Can lag the Atlas until someone refreshes it.",
  },
};

/** The /provenance element id of a class's legend entry. */
export const sourceAnchor = (id: SourceClass): string => `source-${id}`;

/** The /provenance link a mark points at. */
export const sourceHref = (id: SourceClass): string => `/provenance#${sourceAnchor(id)}`;

/** A set of classes in registry order, without duplicates. */
export function normalizeSources(sources: readonly SourceClass[]): SourceClass[] {
  return SOURCE_CLASS_IDS.filter((id) => sources.includes(id));
}

/** The words a reports index search matches for a set of classes. */
export function sourceSearchText(sources: readonly SourceClass[]): string {
  return normalizeSources(sources)
    .map((id) => SOURCE_CLASSES[id].word)
    .join(" ");
}
