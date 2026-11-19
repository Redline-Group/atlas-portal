// The order the sweep reads documents in. A document that links to something
// that moved is due only while that target still reads as moved, so it goes
// immediately before its target: a run that stops early has then read a citer
// without its target (read again next run), never a target without its citers
// (which would never be read).

export interface SweepPlan {
  new: string[];
  changed: string[];
  removed: string[];
  /** Citing document → the moved or removed documents it links to. */
  linkedBecause: Record<string, string[]>;
}

/** Moved or removed document → the unchanged documents that link to it. */
export function citersOf(plan: SweepPlan): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [citer, targets] of Object.entries(plan.linkedBecause)) {
    for (const t of targets) out.set(t, [...(out.get(t) ?? []), citer]);
  }
  return out;
}

/**
 * Up to about `perCycle` documents, in whole groups of (citers, target). A
 * `parked` target takes its citers out with it: they would otherwise be read on
 * every run while the target stays unread.
 */
export function sweepQueue(plan: SweepPlan, perCycle: number, parked: (id: string) => boolean): string[] {
  const citers = citersOf(plan);
  const gone = new Set(plan.removed);
  const out = new Set<string>();
  for (const target of [...plan.removed, ...plan.new, ...plan.changed]) {
    if (out.size >= perCycle) break;
    if (parked(target)) continue;
    for (const c of citers.get(target) ?? []) out.add(c);
    if (!gone.has(target)) out.add(target);
  }
  return [...out];
}

/** Removed documents whose every citer has been read: nothing is waiting on them any more. */
export function settledRemovals(plan: SweepPlan, read: ReadonlySet<string>): string[] {
  const citers = citersOf(plan);
  return plan.removed.filter((id) => (citers.get(id) ?? []).every((c) => read.has(c)));
}
