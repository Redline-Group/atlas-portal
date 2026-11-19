// Edit Candidates — places where the Atlas source text may need an update.
//
// Rows come from every source in lib/editCandidates/registry.ts; loading, the
// live join and the filters live in usePotentialMistakesState. See
// src/lib/potentialMistakesIndex.ts.
import { mistakesToCSV } from "@/lib/potentialMistakesCsv";
import { MISTAKE_SEARCHES, type MistakeRow } from "@/lib/potentialMistakesIndex";
import { type ReportMode } from "@/lib/reportFilter";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { MistakesFilters } from "./MistakesFilters";
import { MistakesProvenance } from "./MistakesProvenance";
import { PotentialMistakesTable } from "./PotentialMistakesTable";
import { ReportShell } from "./ReportShell";
import { MISTAKES_REPORT, activeFilters, mistakeFilterSummary, type MistakeFilterState } from "./useMistakeFilters";
import { usePotentialMistakesState } from "./usePotentialMistakesState";

function MistakesCsvButton({
  all,
  rows,
  query,
  filters: f,
}: {
  all: readonly MistakeRow[];
  rows: readonly MistakeRow[];
  query: string;
  filters: MistakeFilterState;
}) {
  return (
    <DownloadCsvButton
      report={MISTAKES_REPORT}
      filename="edit-candidates.csv"
      rowCount={rows.length}
      build={() => mistakesToCSV(rows)}
      fullRowCount={all.length}
      buildFull={() => mistakesToCSV(all)}
      query={query}
      filters={activeFilters(f)}
    />
  );
}

export function PotentialMistakesReport({ query, mode }: { query: string; mode: ReportMode }) {
  const s = usePotentialMistakesState(query, mode);
  const { all, filters, rows, fixed } = s;
  return (
    <ReportShell
      report={MISTAKES_REPORT}
      // Chrome (title, provenance, filters) stays in the default 5xl column.
      // The table is `fullWidth` so it can use the window minus the shell's
      // px-6 gutter without stretching that column to match.
      maxWidth="max-w-5xl"
      description="Everything in the Atlas source text that may need an update, in one list: typos and grammar slips, broken references, wrong figures, internal inconsistencies, dates that have passed, and values the chain no longer matches — each one quoted, explained, and linked to its document."
      query={query}
      searches={MISTAKE_SEARCHES}
      filters={mistakeFilterSummary(filters, s.buckets)}
      controls={all && <MistakesFilters all={all} buckets={s.buckets} today={s.today} hasDocDates={s.hasDocDates} {...filters} />}
      // Out-of-date candidates are hidden by default, so they leave the total too.
      count={rows ? `${rows.length} of ${(all?.length ?? 0) - (filters.status === "fixed" ? 0 : fixed)} candidates` : undefined}
      actions={all && rows ? <MistakesCsvButton all={all} rows={rows} query={query} filters={filters} /> : undefined}
      loading={!rows}
      viewProps={{ row_count: all?.length ?? 0, drifted: s.drifted, fixed }}
      noRows={!!rows && rows.length === 0}
      fullWidth={rows && rows.length > 0 ? <PotentialMistakesTable rows={rows} rq={s.rq} /> : undefined}
    >
      {all && <MistakesProvenance sweep={s.file} sources={s.sources} total={all.length} drifted={s.drifted} fixed={fixed} />}
    </ReportShell>
  );
}
