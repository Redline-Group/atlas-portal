// The PAU audit's rows. loadPau answers an unreachable API with no
// deployments, which would read here as "nothing disagrees", so that case is
// a failed load.
import { PAU_SOURCE, pauCandidates } from "@/lib/editCandidates/pauRows";
import { loadPau } from "../../pau";
import { loadPauAudit } from "../../pauAudit";
import type { CandidateSource } from "../types";

export const pauAudit: CandidateSource = {
  ...PAU_SOURCE,
  load: async ({ docs }) => {
    if ((await loadPau()).deployments.length === 0) throw new Error("no PAU snapshots");
    return pauCandidates(await loadPauAudit(), docs);
  },
};
