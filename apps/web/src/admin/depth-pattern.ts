const CYCLE_LENGTH = 5;
const LAST_DEPTH = 17;

// depth-6…17 repeat depth-1…5 at the same position in the cycle.
export function depthPatternEntries(valueOf: (name: string) => string): [name: string, value: string][] {
  const entries: [string, string][] = [];
  for (let i = CYCLE_LENGTH + 1; i <= LAST_DEPTH; i++) {
    entries.push([`depth-${i}`, valueOf(`depth-${((i - 1) % CYCLE_LENGTH) + 1}`)]);
  }
  return entries;
}
