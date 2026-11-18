// CSV export for the Potential Mistakes report: one row per finding, with its
// live doc_no, scope, agent and executor agent beside the stored finding.
import { toCSV } from "./csv";
import { atlasUrlOrEmpty } from "./routes";
import { CATEGORY_LABELS, PASS_LABELS, STATUS_LABELS, type MistakeRow } from "./potentialMistakesIndex";

const CSV_HEADERS = [
  "Severity",
  "Category",
  "Pass",
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

/** One row per finding; each row carries the single doc it targets, so a UUID
 *  and Atlas Link always point at exactly one document (empty for the handful
 *  of corpus-wide findings, which by definition have no single target). */
export function mistakesToCSV(rows: readonly MistakeRow[]): string {
  return toCSV(
    CSV_HEADERS,
    rows.map((r) => [
      r.severity,
      CATEGORY_LABELS[r.category] ?? r.category,
      PASS_LABELS[r.pass],
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
    ]),
  );
}
