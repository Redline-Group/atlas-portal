// How a chain value says when it was read. One format everywhere, so "read
// 2026-11-16 14:02 UTC" means the same thing on an address card, a PAU
// deployment and a CSV note.

/** An ISO timestamp as "2026-11-16 14:02 UTC"; null for a missing or unparseable one. */
export function formatReadTime(iso: string | null | undefined): string | null {
  if (!iso || Number.isNaN(Date.parse(iso))) return null;
  return `${iso.slice(0, 16).replace("T", " ")} UTC`;
}

/** The oldest of the timestamps that parse: the age every value in the set is at least as fresh as. */
export function oldestTime(times: readonly (string | null | undefined)[]): string | null {
  const valid = times.filter((t): t is string => !!t && !Number.isNaN(Date.parse(t)));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => (Date.parse(b) < Date.parse(a) ? b : a));
}
