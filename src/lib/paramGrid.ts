// A param value holding a markdown table that is not a holder list
// (paramTable.ts declines it): a rate limit stated per phase, say. Split into
// the sentence before it, its header and rows as written, and any note after,
// so a card can set it as a table instead of a run of pipes. Pure.

export interface ParamGrid {
  /** The text before the table. */
  lead: string;
  header: string[];
  rows: string[][];
  /** The text after the table. */
  note: string;
}

const ROW_RE = /^\s*\|.*\|\s*$/;
const SEPARATOR_RE = /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/;

/** A row's cells, split on its unescaped pipes, each without its backticks. */
const cells = (line: string) => line.trim().slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|").replace(/^`(.*)`$/, "$1"));

/** The value's first table with the text around it; null when it holds none, or a row does not fit its header. */
export function paramGrid(value: string): ParamGrid | null {
  const lines = value.split("\n");
  const at = lines.findIndex((l, i) => ROW_RE.test(l) && SEPARATOR_RE.test(lines[i + 1] ?? ""));
  if (at < 0) return null;
  let end = at + 2;
  while (end < lines.length && ROW_RE.test(lines[end])) end++;
  const header = cells(lines[at]);
  const rows = lines.slice(at + 2, end).map(cells);
  if (rows.length === 0 || rows.some((r) => r.length !== header.length)) return null;
  return { lead: lines.slice(0, at).join("\n").trim(), header, rows, note: lines.slice(end).join("\n").trim() };
}
