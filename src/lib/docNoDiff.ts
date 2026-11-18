// Which parts of a doc number a renumbering changed, segment by segment. A doc
// number is dotted segments (`A.1.2.3`, `A.1.0.3.2`, `A.1.var2`), so the
// comparison is per segment, never per character: `A.1.10` → `A.1.1` changes
// the last segment, it does not drop a trailing `0`. The changed part is one
// contiguous run between a shared prefix and a shared suffix, not an LCS
// (diffCore's lcsOps): a renumbering shifts one level of the number, and
// `A.1.2.1 → A.1.1.2` reads as "the 2.1 became 1.2", not as two scattered edits.

/** One dotted segment of a doc number, and whether the renumbering changed it. */
export interface DocNoSegment {
  text: string;
  changed: boolean;
}

/** A renumbering as segment runs: the shared head and tail, and the one
 *  contiguous run between them on each side (either may be empty). */
export interface DocNoChange {
  head: string[];
  prev: string[];
  next: string[];
  tail: string[];
}

export function docNoChange(prev: string, next: string): DocNoChange {
  const a = prev.split(".");
  const b = next.split(".");
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  return { head: a.slice(0, head), prev: a.slice(head, a.length - tail), next: b.slice(head, b.length - tail), tail: a.slice(a.length - tail) };
}

/** Both sides of a renumbering. The segments the two share at the start and at
 *  the end are unchanged; everything between is changed on each side. */
export function docNoDiff(prev: string, next: string): { prev: DocNoSegment[]; next: DocNoSegment[] } {
  const c = docNoChange(prev, next);
  const seg = (changed: boolean) => (text: string) => ({ text, changed });
  const mark = (run: string[]) => [...c.head.map(seg(false)), ...run.map(seg(true)), ...c.tail.map(seg(false))];
  return { prev: mark(c.prev), next: mark(c.next) };
}
