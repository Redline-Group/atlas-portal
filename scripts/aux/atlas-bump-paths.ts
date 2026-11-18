// Prints the paths an atlas bump commits, one per line, for atlas-update.yml's
// `git add`. The list itself lives in scripts/lib/atlas-bump.ts.
import { ATLAS_BUMP_PATHS } from "../lib/atlas-bump.ts";

console.log(ATLAS_BUMP_PATHS.join("\n"));
