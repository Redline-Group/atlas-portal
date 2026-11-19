// Loaded data + derived rows for the Edit Candidates report.
//
// Rows come from every source in lib/editCandidates/registry.ts. The text
// sweep's rows describe documents as they stood when swept, so joinCandidates
// re-checks each against the atlas currently being served; the other sources
// are computed from that atlas on every visit.
import { useMemo } from "react";
import { loadDocs } from "../../lib/docs";
import { loadGraph } from "../../lib/graph";
import { useLoaded } from "../../hooks/useAtlasData";
import { useUTCDay } from "../../hooks/useUTCDay";
import { matchesRecency } from "@/lib/editCandidates/recency";
import { joinCandidates } from "@/lib/editCandidates/rows";
import { loadModCounts } from "@/lib/history";
import { NO_EXECUTOR, NO_EXECUTOR_LABEL, ownershipResolver, presentBuckets } from "@/lib/mistakeOwnership";
import { loadPotentialMistakes } from "../../lib/potentialMistakesLoad";
import { DISPLAY_CATEGORY_LABELS, mistakeSearchFields, presentCategories, type MistakeRow } from "@/lib/potentialMistakesIndex";
import { filterRows, type ReportMode, type ReportQuery } from "@/lib/reportFilter";
import { useCandidateSources } from "./useCandidateSources";
import { FILTER_KEYS, useMistakeFilters, type MistakeFilterState } from "./useMistakeFilters";
import { useReportQuery } from "./useReportQuery";

function useFilteredMistakes(all: MistakeRow[] | null, f: MistakeFilterState, rq: ReportQuery, today: string, hasDocDates: boolean) {
  const picks = FILTER_KEYS.map((k) => f[k]);
  // Without document history the Doc changed pills are hidden, so a `changed`
  // left in the URL filters nothing rather than emptying the list unseen.
  const changed = hasDocDates ? f.changed : null;
  return useMemo(() => {
    if (!all) return null;
    // A candidate whose quote is gone from the atlas is out of date, so it shows
    // only when its own Doc status pill is picked.
    const fixedShown = f.status === "fixed";
    const picked = all.filter(
      (r) =>
        (fixedShown || r.status !== "fixed") &&
        FILTER_KEYS.every((k, i) => !picks[i] || r[k] === picks[i]) &&
        matchesRecency(r, { found: f.found, changed }, today),
    );
    return filterRows(picked, rq, mistakeSearchFields);
    // picks is rebuilt every render; its values are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, rq, today, f.found, changed, ...picks]);
}

/** Pill keys + labels for every data-derived group, all in one shape. */
function useMistakeBuckets(all: MistakeRow[] | null) {
  return useMemo(() => {
    const rows = all ?? [];
    const cats = presentCategories(rows);
    const sources = [...new Map(rows.map((r) => [r.source, r.sourceLabel]))];
    return {
      categories: { keys: cats, labels: Object.fromEntries(cats.map((c) => [c, DISPLAY_CATEGORY_LABELS[c] ?? c])) },
      scopes: presentBuckets(rows, (r) => r.scope, (r) => r.scopeLabel),
      executors: presentBuckets(rows, (r) => r.executor, (r) => r.executorLabel || NO_EXECUTOR_LABEL, NO_EXECUTOR),
      sources: { keys: sources.map(([id]) => id), labels: Object.fromEntries(sources) },
    };
  }, [all]);
}

export type MistakeBuckets = ReturnType<typeof useMistakeBuckets>;

/** Each document's last-change date, or null when the server keeps no history. */
function useDocChanged(): ReadonlyMap<string, string> | null {
  const mods = useLoaded(loadModCounts, { soft: true });
  return useMemo(
    () => (mods ? new Map(mods.flatMap((m) => (m.lastModified ? [[m.docId, m.lastModified] as const] : []))) : null),
    [mods],
  );
}

export function usePotentialMistakesState(query: string, mode: ReportMode) {
  // The sweep's file is loaded again here only for the banner's sweep line.
  const file = useLoaded(loadPotentialMistakes, { soft: true });
  const docs = useLoaded(loadDocs);
  // The graph only adds the executor agent; without it the report still works.
  const graph = useLoaded(loadGraph, { soft: true });
  const docChanged = useDocChanged();
  const today = useUTCDay();
  const sources = useCandidateSources(docs, today);
  // The list appears once the first source has answered; later ones join it.
  const first = sources.status[0].state !== "pending";
  const all = useMemo(
    () => (docs && first ? joinCandidates(sources.batches, docs, ownershipResolver(docs, graph), docChanged) : null),
    [docs, first, sources.batches, graph, docChanged],
  );
  const filters = useMistakeFilters();
  const rq = useReportQuery(query, mode);
  const rows = useFilteredMistakes(all, filters, rq, today, !!docChanged);
  const drifted = useMemo(
    () => all?.filter((r) => r.status === "renumbered" || r.status === "missing").length ?? 0,
    [all],
  );
  const fixed = useMemo(() => all?.filter((r) => r.status === "fixed").length ?? 0, [all]);
  const buckets = useMistakeBuckets(all);
  return { file, all, filters, rq, rows, drifted, fixed, buckets, today, sources: sources.status, hasDocDates: !!docChanged };
}
