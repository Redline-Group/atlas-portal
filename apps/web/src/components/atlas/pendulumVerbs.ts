import type { Rung } from "./subtreeState";

// The verb describes what the UPCOMING click does, not the current state —
// matches the hidden-sections tab's convention ("View N hidden sections").
// The level is never 0 in a flat view (AtlasReader clamps its display), and
// `dir` stops distinguishing anything there — both directions from rung 1
// land on rung 2 (flatNextRung), so the "hide children" wording never fires.
export function pendulumVerb({ level, dir }: Rung, flat: boolean): string {
  if (level === 2) return "collapse child bodies";
  if (flat) return "expand child bodies";
  if (level === 0) return "show children";
  return dir === 1 ? "expand child bodies" : "hide children";
}

// Alt is the only way to reach the opposite swing, so the tooltip has to
// say so — the affordance is otherwise invisible. With only two positions
// (flat view), alt-click lands on the same target a plain click would —
// there's no "other way" left to swing — so the verb is the same.
export function pendulumReverseVerb(cur: Rung, flat: boolean): string {
  if (flat) return pendulumVerb(cur, flat);
  if (cur.level === 0) return "show children with bodies";
  if (cur.level === 2) return "hide children";
  return cur.dir === 1 ? "hide children" : "expand child bodies";
}

/** The chevron's two labels: the accessible name (capitalised, names the doc)
 *  and the tooltip (both swings). */
export function pendulumLabels(cur: Rung, flat: boolean, docNo: string): { name: string; tooltip: string } {
  const verb = pendulumVerb(cur, flat);
  return {
    name: `${verb[0].toUpperCase()}${verb.slice(1)} under ${docNo}`,
    tooltip: `${verb} (alt-click: ${pendulumReverseVerb(cur, flat)})`,
  };
}
