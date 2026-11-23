import type { CSSProperties } from "react";
import type { FlatEntry } from "@/lib/atlasHelpers";

export interface NodeRowState {
  entry: FlatEntry;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren?: boolean;
  isExiting?: boolean;
  gatedCount?: number;
  idPrefix?: string;
  cradle?: "line" | "foot";
  cradleColor?: string;
}

// What Enter/Space does on a focused row depends on its state (keyRow), so the hint must too.
function focusHint({ entry, isSelected, isExpanded }: NodeRowState): string {
  if (!isSelected || !entry.hasContent) return "reader-row-open";
  return isExpanded ? "reader-row-hide" : "reader-row-show";
}

function rowClassName({ isSelected, cradle }: NodeRowState): string {
  const cradleClass = cradle ? ` in-cradle${cradle === "foot" ? " cradle-foot" : ""}` : "";
  return `atlas-node relative${isSelected ? " is-selected" : ""}${cradleClass}`;
}

function rowStyle(color: string, opacity: number | undefined, cradleColor?: string): CSSProperties {
  return {
    ["--row-color" as string]: color,
    opacity,
    ...(cradleColor ? { ["--cradle-color" as string]: cradleColor } : {}),
  } as CSSProperties;
}

export function nodeRowAttrs(row: NodeRowState, opacity: number | undefined) {
  const { node, color } = row.entry;
  return {
    id: row.idPrefix ? `${row.idPrefix}-${node.id}` : node.id,
    className: rowClassName(row),
    "data-has-hidden": (row.gatedCount ?? 0) > 0 ? "true" : undefined,
    // The selected-body height clamp keys on this, so a childless doc gets its full body.
    "data-has-children": row.hasChildren ? "true" : undefined,
    "data-focus-hint": focusHint(row),
    "data-exiting": row.isExiting ? "true" : undefined,
    "aria-hidden": row.isExiting ? true : undefined,
    // pointer-events: none only blocks the mouse; inert also keeps keyboard focus out while it fades.
    inert: row.isExiting || undefined,
    style: rowStyle(color, opacity, row.cradleColor),
  };
}
