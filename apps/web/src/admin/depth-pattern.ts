const CYCLE_LENGTH = 5;
const LAST_DEPTH = 17;

// The depth ramp repeats its first five colours: each of depth-6…17 takes the
// value of the depth-1…5 token at the same position in the cycle.
export function depthPatternEntries(valueOf: (name: string) => string): [name: string, value: string][] {
  const entries: [string, string][] = [];
  for (let i = CYCLE_LENGTH + 1; i <= LAST_DEPTH; i++) {
    entries.push([`depth-${i}`, valueOf(`depth-${((i - 1) % CYCLE_LENGTH) + 1}`)]);
  }
  return entries;
}
