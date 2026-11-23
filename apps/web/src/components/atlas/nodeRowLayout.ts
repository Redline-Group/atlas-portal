import { useMemo } from "react";
import { segmentDepths, nrChiclets } from "@/lib/depth";
import { annotationTarget } from "@/lib/annotation";
import type { AtlasNode } from "@/types";

// Body indent so expanded text lines up with where the title text begins:
// pl-3 (12) + gap-2 (8) + expand-all (14) + gap-2 (8) + title margin+padding (5),
// plus 15px per chiclet segment (.atlas-chiclet width — keep in sync with
// index.css).
const TITLE_TEXT_OFFSET = 47;
const CHICLET_W = 15;
// gap-2 (8) + the toggle chevron (14): the agent pill may extend past the doc
// numbers to also cover the chevron column, giving a slightly wider cap. It is
// also exactly what an annotation row reclaims by not rendering the chevron
// column at all (see chevronColumn below), so both the title's left edge and the
// expanded body's gutter move in by this much.
const CHEVRON_W = 22;

/** What a row puts between its doc number and its title. */
export type ChevronColumn = "pendulum" | "spacer" | "none";

// No annotation in the atlas has children, so its chevron column is pure
// reserved whitespace between the doc number and the title — the one place
// the indent can be given back for free. The pendulum still wins, so an
// annotation that ever did gain children keeps the column it actually renders.
export function chevronColumn(hasPendulum: boolean, isAnnotation: boolean): ChevronColumn {
  if (hasPendulum) return "pendulum";
  return isAnnotation ? "none" : "spacer";
}

/** The columns left of a row's title: its doc-number chiclets, the doc number
 *  it annotates (annotations only), and the chevron column. The title bar
 *  draws them; the expanded body's gutter spans them. */
export interface RowColumns {
  parts: string[];
  depths: number[];
  annotates: string | null;
  chevron: ChevronColumn;
}

export function useRowColumns(node: AtlasNode, depth: number, hasPendulum: boolean): RowColumns {
  // NR-X nodes carry an opaque global number ("NR-12"), not a positional doc_no.
  // Render the bare token: the "NR-" prefix is neutral (depth 0), the number takes
  // the node's true depth colour — the parent context lives in the tree.
  // Memoised so DocNoChiclets (also memo'd) gets stable array references and
  // skips re-render when only isSelected/isExpanded changes on this node.
  const chiclets = useMemo(() => {
    if (node.doc_no.startsWith("NR-")) return nrChiclets(node.doc_no, depth);
    return { parts: node.doc_no.split("."), depths: segmentDepths(node.doc_no) };
  }, [node.doc_no, depth]);
  const annotates = annotationTarget(node);
  return { ...chiclets, annotates, chevron: chevronColumn(hasPendulum, !!annotates) };
}

/** Widths of the expanded body's left gutter and of the agent pill inside it. */
export function bodyGutter({ parts, chevron }: RowColumns): { width: number; pillMaxWidth: number } {
  const reclaimed = chevron === "none" ? CHEVRON_W : 0;
  return {
    width: TITLE_TEXT_OFFSET - reclaimed + CHICLET_W * parts.length,
    pillMaxWidth: CHICLET_W * parts.length + CHEVRON_W - reclaimed,
  };
}
