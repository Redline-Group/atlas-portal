// The two recency filters of Edit Candidates: when a candidate was first found,
// and when its document last changed in the Atlas. Dates are YYYY-MM-DD and
// compare as strings; "today" is passed in so a caller can pin it.
import type { MistakeRow } from "../potentialMistakesIndex";

export const RECENCY_WINDOWS = ["7", "30", "90"] as const;
export type RecencyWindow = (typeof RECENCY_WINDOWS)[number];

export const RECENCY_LABELS: Record<RecencyWindow, string> = {
  "7": "last 7 days",
  "30": "last 30 days",
  "90": "last 90 days",
};

/** The day `days` before `today`. */
function daysBefore(today: string, days: number): string {
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
}

/** Whether `date` falls in the `days` up to and including `today`; an unknown date never does. */
export function withinDays(date: string, today: string, days: number): boolean {
  return !!date && date <= today && date >= daysBefore(today, days);
}

export interface RecencyPick {
  found: RecencyWindow | null;
  changed: RecencyWindow | null;
}

/** A row passes when it is inside every picked window; a row without the date fails that window. */
export function matchesRecency(r: MistakeRow, pick: RecencyPick, today: string): boolean {
  return (
    (!pick.found || withinDays(r.found, today, Number(pick.found))) &&
    (!pick.changed || withinDays(r.docChanged, today, Number(pick.changed)))
  );
}

/** Rows inside each window, for the pill counts. */
export function recencyCounts(
  rows: readonly MistakeRow[],
  date: (r: MistakeRow) => string,
  today: string,
): Record<RecencyWindow, number> {
  const count = (w: RecencyWindow) => rows.filter((r) => withinDays(date(r), today, Number(w))).length;
  return { "7": count("7"), "30": count("30"), "90": count("90") };
}
