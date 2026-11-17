import type { ComponentProps, ReactNode } from "react";
import type { ChainVerdictKind } from "../lib/chainVerdict";

// The on-chain mark is two blocks joined by a line. A verdict against the chain
// keeps the first block and the line and replaces the second block with the
// result, so "on-chain, and this is what it says" reads left to right. The box
// is 16 × 10, drawn at 0.75em tall so its blocks match the text glyphs' ink height,
// and 1.2em wide: 12px in the 16px mark column at a 10px text size.

const HEAVY = { strokeWidth: 1.4 };

/** What stands where the second block is. */
const SECOND: Record<"block" | ChainVerdictKind, ReactNode> = {
  block: <rect x="9.7" y="2.25" width="5.5" height="5.5" rx=".7" />,
  match: <path d="M9.9 5.3l1.7 1.9 3.3-4.1" {...HEAVY} />,
  mismatch: <path d="M10.1 2.6l4.7 4.8M14.8 2.6l-4.7 4.8" {...HEAVY} />,
  pending: (
    <>
      <circle cx="12.45" cy="5" r="2.8" />
      <path d="M12.45 3.4V5l1.1.8" strokeWidth="1" />
    </>
  ),
  "not-set": (
    <>
      <path d="M12.45 2.4v3.2" {...HEAVY} />
      <path d="M12.45 7.7h.01" strokeWidth="1.7" />
    </>
  ),
  "not-stated": <path d="M10.1 5h4.7" {...HEAVY} />,
  unsure: (
    <>
      <path d="M10.9 3.7c0-1.5 3.1-1.5 3.1.1 0 1.3-1.6 1.4-1.6 2.5" strokeWidth="1.2" />
      <path d="M12.4 8.1h.01" strokeWidth="1.6" />
    </>
  ),
  candidate: (
    <>
      <circle cx="12.45" cy="5" r="2.9" />
      <path d="M12.45 3.6v1.7" />
      <path d="M12.45 6.8h.01" strokeWidth="1.5" />
    </>
  ),
  unread: <path d="M10.2 5h.01M12.45 5h.01M14.7 5h.01" strokeWidth="1.5" />,
};

type ChainSvgProps = Omit<ComponentProps<"svg">, "children"> & { second: ReactNode };

/**
 * The first block and the line, then whatever stands in the second block's place.
 * The wrapper is exactly one line tall, aligned to the top of the line box, and
 * centres the svg inside it. That puts the mark at the middle of the line in any
 * font (a baseline offset would drift with the font's metrics), without lengthening
 * the line, so a chip stays as tall as its neighbours. A small lift sits it
 * with the ink of the words and glyphs beside it, which is above the line's centre.
 */
function ChainSvg({ second, style, ...props }: ChainSvgProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", width: "1.2em", height: "1lh", verticalAlign: "top" }}>
      <svg
        viewBox="0 0 16 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ display: "block", width: "100%", height: "0.75em", transform: "translateY(-0.15em)", ...style }}
        {...props}
      >
        <rect x=".8" y="2.25" width="5.5" height="5.5" rx=".7" />
        <path d="M6.3 5h3.4" />
        {second}
      </svg>
    </span>
  );
}

/** The on-chain source mark, at the text's size and colour. */
export function ChainGlyph(props: Omit<ChainSvgProps, "second">) {
  return <ChainSvg second={SECOND.block} data-slot="chain-glyph" {...props} />;
}

/** A row's verdict against the chain, at the text's size and colour. */
export function ChainVerdict({ kind, ...props }: Omit<ChainSvgProps, "second"> & { kind: ChainVerdictKind }) {
  return <ChainSvg second={SECOND[kind]} data-slot="chain-verdict" data-verdict={kind} {...props} />;
}
