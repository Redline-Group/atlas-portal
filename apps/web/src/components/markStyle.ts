// What every source mark shares, so the chip (SourceMark) and the preview's Δ
// (chat/LinkMark) cannot drift apart: the text size and font, and the one
// token that colours provenance marks and nothing else.

/** Size, font and wrapping of a mark's text. */
export const MARK_TEXT = "mono text-[11px] leading-none whitespace-nowrap no-underline";

/** The colour of a mark's glyph and word, and of a chip's dotted border. */
export const MARK_COLOR = "var(--source-mark)";
