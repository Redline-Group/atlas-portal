// Stale Dates as an Edit Candidates source: every future-tense claim whose date
// has passed. Claims still ahead of today need no edit and stay on Stale Dates.
import { reportPath } from "../reports/registry";
import type { Mistake } from "../potentialMistakesIndex";
import type { StaleDatesReport } from "../staleDates";
import type { CandidateSourceMeta } from "./types";

export const STALE_SOURCE: CandidateSourceMeta = {
  id: "stale-dates",
  label: "Stale dates",
  hint: "Dates the Atlas still phrases as upcoming after they passed, recomputed against today's date on every visit.",
  detailPath: reportPath("stale-dates"),
};

const days = (n: number): string => `${n} day${n === 1 ? "" : "s"}`;

/** One candidate per stale claim, first found on the day its date passed. */
export function staleCandidates(report: StaleDatesReport): Mistake[] {
  return report.stale.map((c, i) => ({
    id: `stale:${c.docId}:${c.dateISO}:${i}`,
    docNo: c.docNo,
    uuid: c.docId,
    file: "",
    category: "stale",
    severity: "high",
    pass: "deterministic",
    quote: c.context,
    issue: `The text phrases ${c.raw} as upcoming, and that date passed ${days(-c.daysUntilStale)} ago.`,
    fix: null,
    firstSeen: c.dateISO,
  }));
}
