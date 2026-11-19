// The text sweep: the AI reading of Atlas documents the atlas worker keeps
// current (potentialMistakesLoad.ts).
import { SWEEP_SOURCE } from "@/lib/potentialMistakesIndex";
import { loadPotentialMistakes } from "../../potentialMistakesLoad";
import type { CandidateSource } from "../types";

export const sweep: CandidateSource = {
  id: SWEEP_SOURCE.source,
  label: SWEEP_SOURCE.sourceLabel,
  hint: "An AI reading of Atlas documents for typos, grammar, wrong figures, broken references and contradictions, re-run by the atlas worker on new and changed documents and the documents that cite them.",
  detailPath: "",
  load: () => loadPotentialMistakes().then((file) => file.findings),
};
