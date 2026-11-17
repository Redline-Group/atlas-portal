import type { RadarPrimitive } from "./actorIndex";
import { rowMarkFor, type CardMarks } from "./rowMark";

/**
 * Whether any parameter row on any card gets a check against the chain. The
 * marks object exists as soon as the snapshots load, but a card draws a mark
 * only for a row with something to check; a page note about checks is true
 * only when at least one row has one.
 */
export function anyRowMarked(marks: CardMarks | null, primitives: readonly RadarPrimitive[]): boolean {
  if (!marks) return false;
  return primitives.some((prim) =>
    [...prim.instances, ...prim.invocations].some((inst) => inst.signalParams.some((p) => rowMarkFor(marks, inst.docId, p) !== null)),
  );
}
