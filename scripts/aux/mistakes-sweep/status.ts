// `mistakes:status`: what changed since the last sweep. Read-only.
import { planSweep } from "../../lib/mistakes-sweep.mjs";
import { flag } from "../atlas-cli-common.ts";
import { backlinksFor, describe, load } from "./context.ts";

export function status(): number {
  const { nodes, layout, state, stale } = load();
  const full = stale || flag("full");
  const plan = planSweep(nodes, state, { full, backlinks: backlinksFor(nodes, full) });
  describe(plan, layout);
  console.log(`last swept: ${state.sweptAt ?? "never"} @ ${(state.atlasSha ?? "—").slice(0, 8)}`);
  return 0;
}
