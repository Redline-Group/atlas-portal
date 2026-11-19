// The day each sweep finding was first found, kept across re-reads.

interface Dated {
  uuid: string | null;
  category: string;
  quote: string;
  firstSeen?: string;
}

const keyOf = (f: Dated): string => `${f.uuid ?? ""}\u0000${f.category}\u0000${f.quote}`;

/**
 * A finding that was already in `previous` under the same (uuid, category,
 * quote) keeps the date it had, so re-reading a document does not make an old
 * finding look new; anything else is dated `today`.
 */
export function stampFirstSeen<T extends Dated>(findings: T[], previous: Dated[], today = new Date().toISOString().slice(0, 10)): Array<T & { firstSeen: string }> {
  const seen = new Map(previous.filter((f) => f.firstSeen).map((f) => [keyOf(f), f.firstSeen!]));
  return findings.map((f) => ({ ...f, firstSeen: f.firstSeen ?? seen.get(keyOf(f)) ?? today }));
}
