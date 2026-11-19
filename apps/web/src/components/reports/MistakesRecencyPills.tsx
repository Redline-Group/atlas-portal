// The third pill row of the Edit Candidates filters: which source produced a
// candidate, when it was first found, and when its document last changed.
import { RECENCY_LABELS, RECENCY_WINDOWS, recencyCounts } from "@/lib/editCandidates/recency";
import { countBy } from "@/lib/potentialMistakesIndex";
import { CategoryPills } from "./CategoryPills";
import type { MistakeFilterProps } from "./MistakesFilterGroups";

export function RecencyPills(p: MistakeFilterProps) {
  return (
    <>
      <CategoryPills
        categories={p.buckets.sources.keys}
        active={p.source}
        onToggle={p.onSource}
        label="Source"
        labelTitle="Which check produced the candidate: the AI text sweep, the Stale Dates scan, or the Atlas-versus-chain PAU audit."
        display={p.buckets.sources.labels}
        counts={countBy(p.all, (r) => r.source)}
      />
      <CategoryPills
        categories={RECENCY_WINDOWS}
        active={p.found}
        onToggle={p.onFound}
        label="First found"
        labelTitle="When the candidate first appeared: the day the sweep first reported it, the day a stale date passed, or the day the chain or the Atlas last moved for an Atlas-versus-chain row. Candidates with no recorded date are left out while one of these is picked."
        display={RECENCY_LABELS}
        counts={recencyCounts(p.all, (r) => r.found, p.today)}
      />
      {p.hasDocDates && (
        <CategoryPills
          categories={RECENCY_WINDOWS}
          active={p.changed}
          onToggle={p.onChanged}
          label="Doc changed"
          labelTitle="When the candidate's document last changed in the Atlas, from the document's edit history. Corpus-wide candidates and documents with no recorded edit are left out while one of these is picked."
          display={RECENCY_LABELS}
          counts={recencyCounts(p.all, (r) => r.docChanged, p.today)}
        />
      )}
    </>
  );
}
