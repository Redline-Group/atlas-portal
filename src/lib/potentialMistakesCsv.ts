// CSV export for the Edit Candidates report: one row per candidate, with its
// source, dates, live doc_no, scope, agent and executor agent.
import { toCSV } from "./csv";
import { atlasUrlOrEmpty } from "./routes";
import { DISPLAY_CATEGORY_LABELS, PASS_LABELS, STATUS_LABELS, type MistakeRow } from "./potentialMistakesIndex";

const CSV_HEADERS = [
  "Confidence",
  "Category",
  "Found By",
  "Source",
  "First Found",
  "Doc Last Changed",
  "Doc No (at sweep)",
  "Doc No (current)",
  "Title",
  "Status",
  "Scope",
  "Agent",
  "Executor Agent",
  "Source File",
  "Quoted Text",
  "Issue",
  "Suggested Fix",
  "UUID",
  "Atlas Link",
];

const csvRow = (r: MistakeRow): string[] => [
  r.severity,
  DISPLAY_CATEGORY_LABELS[r.category] ?? r.category,
  PASS_LABELS[r.pass],
  r.sourceLabel,
  r.found,
  r.docChanged,
  r.docNo,
  r.currentDocNo,
  r.title,
  STATUS_LABELS[r.status],
  r.scopeLabel,
  r.agent,
  r.executorLabel,
  r.file,
  r.quote,
  r.issue,
  r.fix ?? "",
  r.uuid ?? "",
  atlasUrlOrEmpty(r.uuid),
];

/** One row per candidate; each row carries the single doc it targets, so a UUID
 *  and Atlas Link always point at exactly one document (empty for the handful
 *  of corpus-wide candidates, which by definition have no single target). */
export function mistakesToCSV(rows: readonly MistakeRow[]): string {
  return toCSV(CSV_HEADERS, rows.map(csvRow));
}
