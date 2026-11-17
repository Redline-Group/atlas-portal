import type { SourceSurface } from "./types";

export const DERIVED_SURFACES: readonly SourceSurface[] = [
  {
    name: "Extracted structure",
    from: "Pattern-based extractors read Atlas text: entities, roles, relationships, instances, parameters, address classes and the labels found near an address. They are our interpretation, not extra claims from the Atlas.",
    fresh: "Rebuilt whenever the Atlas commit changes.",
    where: "Radar, the reader's relations and cousin lists, the Facilitator, GovOps and Active Data reports, and address labels.",
  },
  {
    name: "Computed figures",
    from: "Arithmetic over data the app already holds: date checks against today (Stale Dates), edit counts and eras (Modification Frequency), and totals over settlement rows.",
    fresh: "As current as the data they read.",
    where: "Stale Dates, Modification Frequency, Radar's settlement charts.",
  },
];
