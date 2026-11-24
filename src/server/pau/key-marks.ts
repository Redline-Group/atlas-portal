// Which address arguments of a named key sit outside its prime: stated nowhere
// in the prime's artifact and not one of the deployment's own contracts or
// their reads. Worked out on every rebuild for every named key, a name reused
// from an earlier snapshot included, so an atlas edit moves the mark with it,
// as retired-addresses.ts does for retired addresses. Without the prime's
// atlas no key is marked: the reader cannot tell, so it claims nothing.
import type { DerivedKey, PauSnapshot } from "../../lib/pau.ts";
import { EVM_ADDRESS_EXACT_RE } from "../../lib/patterns.ts";
import { primeAndOwn } from "./key-tiers.ts";
import type { KeyContext } from "./key-context.ts";
import { mapLimits } from "./snapshot.ts";

function marked(d: DerivedKey, near: Set<string> | null): DerivedKey {
  const { outsidePrime: _stale, ...rest } = d;
  const outside = near ? [...new Set(d.args.filter((a) => EVM_ADDRESS_EXACT_RE.test(a) && !near.has(a.toLowerCase())))] : [];
  return outside.length ? { ...rest, outsidePrime: outside } : rest;
}

/** `snap` with each named key's `outsidePrime` set from `context`, or cleared when there is none. */
export function withPrimeMarks(snap: PauSnapshot, context: KeyContext | undefined): PauSnapshot {
  const near = context ? new Set(primeAndOwn(context).map((a) => a.toLowerCase())) : null;
  return mapLimits(snap, (x) => (x.derived ? { ...x, derived: marked(x.derived, near) } : x));
}
