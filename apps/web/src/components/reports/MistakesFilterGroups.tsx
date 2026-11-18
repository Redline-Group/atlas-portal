// The two pill rows of the Potential Mistakes filters: what a finding is
// (severity, category, pass) and where it lives (scope, executor agent, live
// doc status). Every active pill lives in the URL via usePotentialMistakesState.
import {
  PASSES,
  PASS_LABELS,
  SEVERITIES,
  STATUS_LABELS,
  countBy,
  type MistakeRow,
  type MistakeStatus,
} from "@/lib/potentialMistakesIndex";
import { CategoryPills } from "./CategoryPills";
import type { MistakeBuckets, MistakeFilterState } from "./usePotentialMistakesState";

const STATUSES: readonly MistakeStatus[] = ["current", "renumbered", "missing", "corpus"];

export type MistakeFilterProps = MistakeFilterState & { all: readonly MistakeRow[]; buckets: MistakeBuckets };

/** What the finding is: how sure, what kind, which pass found it. */
export function KindPills({ all, buckets, severity, onSeverity, category, onCategory, pass, onPass }: MistakeFilterProps) {
  return (
    <>
      <CategoryPills
        categories={SEVERITIES}
        active={severity}
        onToggle={onSeverity}
        label="Severity"
        labelTitle="How confident the sweep was that this is a real defect — not how damaging it would be."
        counts={countBy(all, (r) => r.severity)}
        showSingle
      />
      <CategoryPills
        categories={buckets.categories.keys}
        active={category}
        onToggle={onCategory}
        label="Category"
        display={buckets.categories.labels}
        counts={countBy(all, (r) => r.category)}
      />
      <CategoryPills
        categories={PASSES}
        active={pass}
        onToggle={onPass}
        label="Found by"
        labelTitle="Which sweep pass reported the finding: a language read, a consistency read, or a mechanical scan."
        display={PASS_LABELS}
        counts={countBy(all, (r) => r.pass)}
      />
    </>
  );
}

/** Where the finding lives: Atlas scope, accountable executor agent, live doc status. */
export function PlacePills({ all, buckets, scope, onScope, executor, onExecutor, status, onStatus }: MistakeFilterProps) {
  return (
    <>
      <CategoryPills
        categories={buckets.scopes.keys}
        active={scope}
        onToggle={onScope}
        label="Scope"
        labelTitle="The top-level Atlas Scope the document sits in, checked live against the Atlas being served."
        display={buckets.scopes.labels}
        counts={countBy(all, (r) => r.scope)}
        showSingle
      />
      <CategoryPills
        categories={buckets.executors.keys}
        active={executor}
        onToggle={onExecutor}
        label="Executor agent"
        labelTitle="The Executor Agent accountable for the Agent Artifact the document sits in — a Prime's operational executor, or the executor itself for its own artifact. Documents outside every agent artifact have none."
        display={buckets.executors.labels}
        counts={countBy(all, (r) => r.executor)}
        showSingle
      />
      <CategoryPills
        categories={STATUSES}
        active={status}
        onToggle={onStatus}
        label="Doc status"
        labelTitle="Checked live against the Atlas being served right now — findings whose document moved or vanished since the sweep."
        display={STATUS_LABELS}
        counts={countBy(all, (r) => r.status)}
      />
    </>
  );
}
