import { ROUTES } from "@/lib/routes";

// Exact legacy URLs that redirect straight to their replacement, no param
// interpolation needed. /reports/crossview/contents survives the removed
// Contents tab (superseded by Shape's "Doc mass by scope"); /library and
// /reports/library survive the Library → CrossView rename; /constellations
// survives the removed Constellations page (Radar is the remaining entity
// relationship surface); /reports/potential-mistakes survives that report's
// rename to Edit Candidates. A redirect carries the query string across, so a
// saved filter link still lands filtered.
export const LEGACY_REDIRECTS: [from: string, to: string][] = [
  ["/reports/crossview/contents", ROUTES.REPORTS_CROSSVIEW],
  ["/library", ROUTES.REPORTS_CROSSVIEW],
  ["/reports/library", ROUTES.REPORTS_CROSSVIEW],
  ["/constellations", ROUTES.RADAR],
  ["/reports/potential-mistakes", ROUTES.REPORTS_EDIT_CANDIDATES],
];

// Legacy URLs whose trailing :tab* segment is preserved onto the replacement
// route, e.g. /library/glossary → /reports/crossview/glossary. Bare
// "/library" (no trailing segment) doesn't match "/library/:tab*" in wouter
// — the pattern requires the literal slash — so each needs its own exact
// route in LEGACY_REDIRECTS above alongside the wildcard one here.
export const LEGACY_REDIRECT_PREFIXES: string[] = ["/library/:tab*", "/reports/library/:tab*"];
