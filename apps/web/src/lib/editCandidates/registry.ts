// Every source of Edit Candidates rows. Adding one is a new file in sources/
// plus one line here; the Source pills, the banner's source list and the CSV
// column all read this list.
import { pauAudit } from "./sources/pauAudit";
import { staleDates } from "./sources/staleDates";
import { sweep } from "./sources/sweep";
import type { CandidateSource } from "./types";

export const CANDIDATE_SOURCES: readonly CandidateSource[] = [sweep, staleDates, pauAudit];
