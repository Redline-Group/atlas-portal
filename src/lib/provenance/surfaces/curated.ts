import type { SourceSurface } from "./types";

export const CURATED_SURFACES: readonly SourceSurface[] = [
  {
    name: "Process inventory",
    from: "A hand-kept list of governance, settlement, lifecycle and operational processes, reconciled against the Atlas when it drifts.",
    fresh: "Can lag the Atlas until someone refreshes it.",
    where: "The Processes report.",
  },
  {
    name: "PAU registry",
    from: "A hand-triaged list of the contracts that make up each Prime Agent's PAU. An address the registry does not list is never read.",
    fresh: "Updated when a Prime deploys or retires a contract.",
    where: "Radar's Liquidity Layer page and the PAU audit. A contract the Atlas does not state has a dotted underline.",
  },
  {
    name: "Analyst notes",
    from: "The CrossView concept catalog and audit notes, written by hand and by agents, each quoting the Atlas as its evidence.",
    fresh: "As of the last time an analyst refreshed them.",
    where: "The CrossView reports.",
  },
];
