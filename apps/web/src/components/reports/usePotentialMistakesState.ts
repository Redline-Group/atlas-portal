// URL-synced filter state + derived rows for the Potential Mistakes report.
//
// The rows are a hand-run LLM sweep (public/potential-mistakes.json), NOT
// derived from the atlas at load time. The one live computation is
// resolveMistakes(), which re-checks every finding's UUID against the atlas
// currently being served so drift is visible instead of silent.
import { useMemo } from "react";
import { loadDocs } from "../../lib/docs";
import { loadGraph } from "../../lib/graph";
import { useLoaded } from "../../hooks/useAtlasData";
import { urlString } from "../../hooks/useUrlState";
import { NO_EXECUTOR, NO_EXECUTOR_LABEL, ownershipResolver, presentBuckets } from "@/lib/mistakeOwnership";
import { loadPotentialMistakes } from "../../lib/potentialMistakesLoad";
import {
  CATEGORY_LABELS,
  PASS_LABELS,
  STATUS_LABELS,
  mistakeSearchFields,
  presentCategories,
  resolveMistakes,
  type MistakePass,
  type MistakeRow,
  type MistakeSeverity,
  type MistakeStatus,
} from "@/lib/potentialMistakesIndex";
import { filterRows, type ReportMode, type ReportQuery } from "@/lib/reportFilter";
import type { ReportId } from "@/types";
import { categoryCodec } from "./CategoryPills";
import { useReportFilter, useReportQuery } from "./useReportQuery";

const REPORT: ReportId = "potential-mistakes";

// Each filter is single-select and clears on re-click, so they all use the
// shared nullable enum codec keyed by its own label map.
const SEVERITY_LABELS: Record<MistakeSeverity, string> = { high: "high", medium: "medium", low: "low" };
const sevCodec = categoryCodec(SEVERITY_LABELS);
const passCodec = categoryCodec(PASS_LABELS);
const statusCodec = categoryCodec(STATUS_LABELS);
const catCodec = categoryCodec(CATEGORY_LABELS);
// Scope and executor buckets are derived from the live atlas, so their codec
// accepts any key; one that matches no row simply filters to nothing.
const ownerCodec = urlString();

/** The pill filters, named to match MistakesFilters' props. */
function useMistakeFilters() {
  const [severity, onSeverity] = useReportFilter<MistakeSeverity>(REPORT, "sev", sevCodec, "severity");
  const [pass, onPass] = useReportFilter<MistakePass>(REPORT, "pass", passCodec);
  const [status, onStatus] = useReportFilter<MistakeStatus>(REPORT, "status", statusCodec);
  const [category, onCategory] = useReportFilter<string>(REPORT, "cat", catCodec, "category");
  const [scope, onScope] = useReportFilter<string>(REPORT, "scope", ownerCodec);
  const [executor, onExecutor] = useReportFilter<string>(REPORT, "exec", ownerCodec, "executor");
  return {
    severity, onSeverity, pass, onPass, status, onStatus, category, onCategory,
    scope, onScope, executor, onExecutor,
  };
}

export type MistakeFilterState = ReturnType<typeof useMistakeFilters>;

/** Each pill filter's state key, which is also the MistakeRow field it matches. */
export const FILTER_KEYS = ["severity", "pass", "status", "category", "scope", "executor"] as const;

function useFilteredMistakes(all: MistakeRow[] | null, f: MistakeFilterState, rq: ReportQuery) {
  const picks = FILTER_KEYS.map((k) => f[k]);
  return useMemo(() => {
    if (!all) return null;
    // A finding whose quote is gone from the atlas is out of date, so it shows
    // only when its own Doc status pill is picked.
    const fixedShown = f.status === "fixed";
    const picked = all.filter(
      (r) => (fixedShown || r.status !== "fixed") && FILTER_KEYS.every((k, i) => !picks[i] || r[k] === picks[i]),
    );
    return filterRows(picked, rq, mistakeSearchFields);
    // picks is rebuilt every render; its values are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, rq, ...picks]);
}

/** Pill keys + labels for every data-derived group, all in one shape. */
function useMistakeBuckets(all: MistakeRow[] | null) {
  return useMemo(() => {
    const rows = all ?? [];
    const cats = presentCategories(rows);
    return {
      categories: { keys: cats, labels: Object.fromEntries(cats.map((c) => [c, CATEGORY_LABELS[c] ?? c])) },
      scopes: presentBuckets(rows, (r) => r.scope, (r) => r.scopeLabel),
      executors: presentBuckets(rows, (r) => r.executor, (r) => r.executorLabel || NO_EXECUTOR_LABEL, NO_EXECUTOR),
    };
  }, [all]);
}

export type MistakeBuckets = ReturnType<typeof useMistakeBuckets>;

/** Filter-summary chips for the shell, one per active pill. */
export function mistakeFilterSummary(f: MistakeFilterState, b: MistakeBuckets) {
  return [
    f.severity && `severity: ${f.severity}`,
    f.pass && `pass: ${PASS_LABELS[f.pass]}`,
    f.status && `status: ${STATUS_LABELS[f.status]}`,
    f.category && `category: ${b.categories.labels[f.category] ?? f.category}`,
    f.scope && `scope: ${b.scopes.labels[f.scope] ?? f.scope}`,
    f.executor && `executor agent: ${b.executors.labels[f.executor] ?? f.executor}`,
  ];
}

export function usePotentialMistakesState(query: string, mode: ReportMode) {
  const file = useLoaded(loadPotentialMistakes);
  const docs = useLoaded(loadDocs);
  // The graph only adds the executor agent; without it the report still works.
  const graph = useLoaded(loadGraph, { soft: true });
  // Live join against the served atlas — the only part of this report that is
  // not frozen at sweep time.
  const all = useMemo(
    () => (file && docs ? resolveMistakes(file, docs, ownershipResolver(docs, graph)) : null),
    [file, docs, graph],
  );
  const filters = useMistakeFilters();
  const rq = useReportQuery(query, mode);
  const rows = useFilteredMistakes(all, filters, rq);
  const drifted = useMemo(
    () => all?.filter((r) => r.status === "renumbered" || r.status === "missing").length ?? 0,
    [all],
  );
  const fixed = useMemo(() => all?.filter((r) => r.status === "fixed").length ?? 0, [all]);
  const buckets = useMistakeBuckets(all);
  return { file, all, filters, rq, rows, drifted, fixed, buckets };
}
