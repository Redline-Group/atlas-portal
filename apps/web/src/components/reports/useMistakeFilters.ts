// The URL-synced pill filters of Edit Candidates. Each is single-select and
// clears on re-click, so they share the nullable enum codec keyed by a label map.
import { urlString } from "../../hooks/useUrlState";
import { RECENCY_LABELS, type RecencyWindow } from "@/lib/editCandidates/recency";
import {
  DISPLAY_CATEGORY_LABELS,
  PASS_LABELS,
  STATUS_LABELS,
  type MistakePass,
  type MistakeSeverity,
  type MistakeStatus,
} from "@/lib/potentialMistakesIndex";
import type { ReportId } from "@/types";
import { categoryCodec } from "./CategoryPills";
import { useReportFilter } from "./useReportQuery";

export const MISTAKES_REPORT: ReportId = "edit-candidates";

const SEVERITY_LABELS: Record<MistakeSeverity, string> = { high: "high", medium: "medium", low: "low" };
const sevCodec = categoryCodec(SEVERITY_LABELS);
const passCodec = categoryCodec(PASS_LABELS);
const statusCodec = categoryCodec(STATUS_LABELS);
const catCodec = categoryCodec(DISPLAY_CATEGORY_LABELS);
const recencyCodec = categoryCodec(RECENCY_LABELS);
// Scope, executor and source buckets are derived from live data, so their
// codec accepts any key; one that matches no row simply filters to nothing.
const anyCodec = urlString();

/** What a candidate is and where its document sits. */
function useKindFilters() {
  const [severity, onSeverity] = useReportFilter<MistakeSeverity>(MISTAKES_REPORT, "sev", sevCodec, "severity");
  const [pass, onPass] = useReportFilter<MistakePass>(MISTAKES_REPORT, "pass", passCodec);
  const [status, onStatus] = useReportFilter<MistakeStatus>(MISTAKES_REPORT, "status", statusCodec);
  const [category, onCategory] = useReportFilter<string>(MISTAKES_REPORT, "cat", catCodec, "category");
  const [scope, onScope] = useReportFilter<string>(MISTAKES_REPORT, "scope", anyCodec);
  const [executor, onExecutor] = useReportFilter<string>(MISTAKES_REPORT, "exec", anyCodec, "executor");
  return {
    severity, onSeverity, pass, onPass, status, onStatus, category, onCategory,
    scope, onScope, executor, onExecutor,
  };
}

/** The pill filters, named to match the filter components' props. */
export function useMistakeFilters() {
  const [source, onSource] = useReportFilter<string>(MISTAKES_REPORT, "src", anyCodec, "source");
  const [found, onFound] = useReportFilter<RecencyWindow>(MISTAKES_REPORT, "found", recencyCodec, "first_found");
  const [changed, onChanged] = useReportFilter<RecencyWindow>(MISTAKES_REPORT, "changed", recencyCodec, "doc_changed");
  return { ...useKindFilters(), source, onSource, found, onFound, changed, onChanged };
}

export type MistakeFilterState = ReturnType<typeof useMistakeFilters>;

/** Each equality filter's state key, which is also the MistakeRow field it matches. */
export const FILTER_KEYS = ["severity", "pass", "status", "category", "scope", "executor", "source"] as const;

/** Every active pill's value, for the CSV button's "is anything filtered" check. */
export const activeFilters = (f: MistakeFilterState) => [...FILTER_KEYS.map((k) => f[k]), f.found, f.changed];

type Labels = { labels: Record<string, string> };

/** Filter-summary chips for the shell, one per active pill. */
export function mistakeFilterSummary(f: MistakeFilterState, b: { categories: Labels; scopes: Labels; executors: Labels; sources: Labels }) {
  return [
    f.severity && `confidence: ${f.severity}`,
    f.pass && `found by: ${PASS_LABELS[f.pass]}`,
    f.status && `status: ${STATUS_LABELS[f.status]}`,
    f.category && `category: ${b.categories.labels[f.category] ?? f.category}`,
    f.scope && `scope: ${b.scopes.labels[f.scope] ?? f.scope}`,
    f.executor && `executor agent: ${b.executors.labels[f.executor] ?? f.executor}`,
    f.source && `source: ${b.sources.labels[f.source] ?? f.source}`,
    f.found && `first found: ${RECENCY_LABELS[f.found]}`,
    f.changed && `doc changed: ${RECENCY_LABELS[f.changed]}`,
  ];
}
