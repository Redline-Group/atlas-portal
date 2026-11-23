import type { CSSProperties } from "react";
import type { FlatEntry } from "@/lib/atlasHelpers";

/** The row state its <article> reflects as attributes. */
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

// Footer hint (useContextHints): the row is tabIndex={0}, so Enter/Space act on
// it once focused — but on WHAT depends on the row's state (see keyRow in
// useRowActivation.ts), so the marker has to say which.
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

/** The <article>'s identity and state attributes. `opacity` is the row's
 *  preview fade. */
export function nodeRowAttrs(row: NodeRowState, opacity: number | undefined) {
  const { node, color } = row.entry;
  return {
    id: row.idPrefix ? `${row.idPrefix}-${node.id}` : node.id,
    className: rowClassName(row),
    "data-has-hidden": (row.gatedCount ?? 0) > 0 ? "true" : undefined,
    // The selected-body height clamp (index.css, "R2") keys on this: the
    // sticky pin it protects can only engage when the row has descendants
    // to pin over, so a childless doc gets its full body, no inner scroller.
    "data-has-children": row.hasChildren ? "true" : undefined,
    "data-focus-hint": focusHint(row),
    "data-exiting": row.isExiting ? "true" : undefined,
    "aria-hidden": row.isExiting ? true : undefined,
    // `pointer-events: none` (index.css) only blocks the mouse — inert also
    // pulls the row and everything in it out of the tab order and off the
    // accessibility tree while it fades, so focus/keyboard nav can't land on
    // (or act through) a row already marked aria-hidden.
    inert: row.isExiting || undefined,
    style: rowStyle(color, opacity, row.cradleColor),
  };
}
