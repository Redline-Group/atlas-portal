import type { Rung } from "./subtreeState";

// The verb describes what the UPCOMING click does, not the current state.
export function pendulumVerb({ level, dir }: Rung, flat: boolean): string {
  if (level === 2) return "collapse child bodies";
  if (flat) return "expand child bodies";
  if (level === 0) return "show children";
  return dir === 1 ? "expand child bodies" : "hide children";
}

// In a flat view there are only two positions, so alt-click lands where a plain click does.
export function pendulumReverseVerb(cur: Rung, flat: boolean): string {
  if (flat) return pendulumVerb(cur, flat);
  if (cur.level === 0) return "show children with bodies";
  if (cur.level === 2) return "hide children";
  return cur.dir === 1 ? "hide children" : "expand child bodies";
}

export function pendulumLabels(cur: Rung, flat: boolean, docNo: string): { name: string; tooltip: string } {
  const verb = pendulumVerb(cur, flat);
  return {
    name: `${verb[0].toUpperCase()}${verb.slice(1)} under ${docNo}`,
    tooltip: `${verb} (alt-click: ${pendulumReverseVerb(cur, flat)})`,
  };
}
