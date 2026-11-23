export type RungLevel = 0 | 1 | 2;
export type RungDir = 1 | -1;
export interface Rung {
  level: RungLevel;
  dir: RungDir;
}
export const DEFAULT_RUNG: Rung = { level: 0, dir: 1 };

// hidden → titles → bodies → titles → hidden …; dir resets to +1 at 0 so the next click climbs again.
export function nextRung(cur: Rung): Rung {
  if (cur.level === 0) return { level: 1, dir: 1 };
  if (cur.level === 2) return { level: 1, dir: -1 };
  return cur.dir === 1 ? { level: 2, dir: 1 } : { level: 0, dir: 1 };
}

// Alt-click: from either end there is no "other step", so it crosses to the far end instead of stalling.
export function reverseRung(cur: Rung): Rung {
  if (cur.level === 0) return { level: 2, dir: 1 };
  if (cur.level === 2) return { level: 0, dir: 1 };
  return cur.dir === 1 ? { level: 0, dir: 1 } : { level: 2, dir: 1 };
}

export function rungClass(level: RungLevel): string {
  if (level === 2) return "is-open";
  if (level === 0) return "is-hidden";
  return "";
}

export function rungAngle(level: RungLevel): number {
  if (level === 0) return -90;
  if (level === 2) return 90;
  return 0;
}

export function rungHoverAngle(cur: Rung, flat = false): number {
  return (rungAngle(cur.level) + rungAngle(swingRung(cur, { flat }).level)) / 2;
}

export function rungReverseHoverAngle(cur: Rung, flat = false): number {
  return (rungAngle(cur.level) + rungAngle(swingRung(cur, { flat, reverse: true }).level)) / 2;
}

// Flat views never hide rows for rung 0, so swinging to 0 would be a dead click; these skip it.
export function flatRung(cur: Rung): Rung {
  return cur.level === 0 ? { level: 1, dir: 1 } : cur;
}

export function flatNextRung(cur: Rung): Rung {
  const c = flatRung(cur);
  const next = nextRung(c);
  if (next.level !== 0) return next;
  return c.level === 2 ? { level: 1, dir: 1 } : { level: 2, dir: 1 };
}

export function flatReverseRung(cur: Rung): Rung {
  const c = flatRung(cur);
  const next = reverseRung(c);
  if (next.level !== 0) return next;
  return c.level === 2 ? { level: 1, dir: 1 } : { level: 2, dir: 1 };
}

export function swingRung(cur: Rung, opts: { flat?: boolean; reverse?: boolean }): Rung {
  if (opts.flat) return opts.reverse ? flatReverseRung(cur) : flatNextRung(cur);
  return opts.reverse ? reverseRung(cur) : nextRung(cur);
}
