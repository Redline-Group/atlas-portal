import { useMemo } from "react";
import { segmentDepths, nrChiclets } from "@/lib/depth";
import { annotationTarget } from "@/lib/annotation";
import type { AtlasNode } from "@/types";

// pl-3 + gap-2 + chevron + gap-2 + title padding; CHICLET_W must match .atlas-chiclet in index.css.
const TITLE_TEXT_OFFSET = 47;
const CHICLET_W = 15;
// gap-2 + chevron: what an annotation row reclaims by dropping the chevron column.
const CHEVRON_W = 22;

export type ChevronColumn = "pendulum" | "spacer" | "none";

// Annotations have no children, so their chevron column is free to give back; the pendulum still wins.
export function chevronColumn(hasPendulum: boolean, isAnnotation: boolean): ChevronColumn {
  if (hasPendulum) return "pendulum";
  return isAnnotation ? "none" : "spacer";
}

export interface RowColumns {
  parts: string[];
  depths: number[];
  annotates: string | null;
  chevron: ChevronColumn;
}

export function useRowColumns(node: AtlasNode, depth: number, hasPendulum: boolean): RowColumns {
  // Memoised so the memo'd DocNoChiclets gets stable arrays. NR-X numbers are global, not positional.
  const chiclets = useMemo(() => {
    if (node.doc_no.startsWith("NR-")) return nrChiclets(node.doc_no, depth);
    return { parts: node.doc_no.split("."), depths: segmentDepths(node.doc_no) };
  }, [node.doc_no, depth]);
  const annotates = annotationTarget(node);
  return { ...chiclets, annotates, chevron: chevronColumn(hasPendulum, !!annotates) };
}

export function bodyGutter({ parts, chevron }: RowColumns): { width: number; pillMaxWidth: number } {
  const reclaimed = chevron === "none" ? CHEVRON_W : 0;
  return {
    width: TITLE_TEXT_OFFSET - reclaimed + CHICLET_W * parts.length,
    pillMaxWidth: CHICLET_W * parts.length + CHEVRON_W - reclaimed,
  };
}
