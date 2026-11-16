import type { SourceClass } from "../sources";
import { AI_SURFACES } from "./ai";
import { CURATED_SURFACES } from "./curated";
import { DERIVED_SURFACES } from "./derived";
import { EXTERNAL_SURFACES } from "./external";
import { ONCHAIN_SURFACES } from "./onchain";
import type { SourceSurface } from "./types";

export type { SourceSurface };

/** Every surface that shows non-Atlas data, by source class; the /provenance legend renders this. */
export const SOURCE_SURFACES: Record<SourceClass, readonly SourceSurface[]> = {
  onchain: ONCHAIN_SURFACES,
  external: EXTERNAL_SURFACES,
  derived: DERIVED_SURFACES,
  ai: AI_SURFACES,
  curated: CURATED_SURFACES,
};
