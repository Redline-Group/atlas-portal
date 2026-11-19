// Stale Dates, recomputed from the loaded atlas and the current day.
import { STALE_SOURCE, staleCandidates } from "@/lib/editCandidates/staleRows";
import { buildStaleDatesReport } from "@/lib/staleDates";
import type { CandidateSource } from "../types";

export const staleDates: CandidateSource = {
  ...STALE_SOURCE,
  load: async ({ docs, today }) => staleCandidates(buildStaleDatesReport(docs, new Date(`${today}T12:00:00Z`))),
};
