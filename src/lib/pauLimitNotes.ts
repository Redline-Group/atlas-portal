// The two caveats a rate-limit row can carry, shown on the page rather than
// only in a tooltip. A live read that failed leaves the last value the history
// set; a limit with no unit has its decimals inferred from its size
// (inferDecimals, pauView.ts).

export const FAILED_READ_NOTE = "live read failed; showing the last value its history set";
export const INFERRED_DECIMALS_NOTE = "decimals inferred from the limit's size";

interface Caveatable {
  data?: unknown;
  unit?: unknown;
}

export interface LimitCaveats {
  /** The contract could not be read live for this key. */
  failed: boolean;
  /** The amount's scale is a guess: no token or pool unit was found. */
  inferred: boolean;
}

/** `off` limits show no amount, so a guessed scale does not matter for them. */
export function limitCaveats(r: Caveatable, off: boolean): LimitCaveats {
  return { failed: !r.data, inferred: !r.unit && !off };
}

export function caveatCounts<R extends Caveatable>(limits: readonly R[], isOff: (r: R) => boolean): { failed: number; inferred: number } {
  let failed = 0;
  let inferred = 0;
  for (const r of limits) {
    const c = limitCaveats(r, isOff(r));
    if (c.failed) failed++;
    if (c.inferred) inferred++;
  }
  return { failed, inferred };
}
