import { Link } from "./Link";
import { reportHref } from "@/lib/routes";
import { parseReportQuery } from "@/lib/reportFilter";
import type { ReportCard, ReportCardGroup } from "@/lib/reportCatalog";
import { track } from "../lib/analytics";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useReportIndexSearch } from "../hooks/useReportIndexSearch";
import { Highlight } from "./reports/Highlight";
import { SourceMarks } from "./SourceMark";

// Thin renderer over src/lib/reportCatalog.ts (grouping + sources) and
// useReportIndexSearch (lexical filter + server paraphrases). Groups are by
// SUBJECT (what a report is about, which is how people browse); the sources a
// report draws on ride along as per-card chips so neither axis has to distort
// the other.
// Meaning-only extras render in their own block so a vector hit is visible
// instead of looking like a name match.

function Card({ card, rq }: { card: ReportCard; rq: ReturnType<typeof parseReportQuery> }) {
  return (
    <Link
      to={reportHref(card.id)}
      className="w-full text-left px-4 py-4 rounded border transition-colors hover:bg-[var(--hover)] block no-underline"
      style={{ borderColor: "var(--border)" }}
      onClick={() => track("report_open", { report_id: card.id })}
    >
      <p className="text-sm font-medium mb-1 flex items-center gap-2 flex-wrap" style={{ color: "var(--tan)" }}>
        <Highlight text={card.title} rq={rq} punct />
        <SourceMarks sources={card.sources} unlinked />
      </p>
      <p className="text-xs" style={{ color: "var(--tan-3)" }}>
        <Highlight text={card.description} rq={rq} punct />
      </p>
    </Link>
  );
}

export function ReportsIndex({ query }: { query: string }) {
  useDocumentTitle("Reports: Redline Portal");
  const { wording, meaning, pending, byMeaning } = useReportIndexSearch(query);
  const rq = parseReportQuery(query);
  const sections = (groups: ReportCardGroup[], keyPrefix: string) =>
    groups.map((g) => (
      <section key={`${keyPrefix}${g.title}`} className="mb-8">
        <h2 className="text-xs mono text-tan-3 uppercase tracking-wider mb-1 pb-1 border-b border-[var(--border)]">
          <Highlight text={g.title} rq={rq} punct />
        </h2>
        <p className="text-xs mb-3" style={{ color: "var(--tan-3)" }}>
          <Highlight text={g.hint} rq={rq} punct />
        </p>
        <div className="space-y-3">
          {g.cards.map((c) => (
            <Card key={c.id} card={c} rq={rq} />
          ))}
        </div>
      </section>
    ));

  return (
    <div className="px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <p className="mono text-xs text-tan-3 mb-1">reports</p>
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--tan)" }}>
          Reports
        </h1>
        <p className="text-xs mb-6" style={{ color: "var(--tan-3)" }}>
          Reports are rebuilt every time you open them. A chip beside a title names what the report
          draws on besides Atlas text: chain reads, outside records, our own derivations, a model or
          lists we keep by hand. No chip means Atlas text only.
        </p>
        {sections(wording, "")}
        {byMeaning && (
          <>
            <p className="text-xs mb-6" style={{ color: "var(--tan-3)" }}>
              Closest meaning, not an exact wording match.
            </p>
            {sections(meaning, "meaning-")}
          </>
        )}
        {wording.length === 0 && meaning.length === 0 && (
          <p className="mono text-xs" style={{ color: "var(--tan-3)" }}>
            {pending ? "Searching…" : `No reports match "${query}".`}
          </p>
        )}
      </div>
    </div>
  );
}
