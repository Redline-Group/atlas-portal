// One place the app shows something that is not verbatim Atlas text, described
// for the /provenance page: what it is, where it comes from, how current it
// is, and where a reader meets it. Entries live per class (one file each) and
// the page's "Reading the marks" legend renders them, so a new surface is one
// entry, not an edit to the page.

export interface SourceSurface {
  /** What it is, in a few words. */
  name: string;
  /** Where the data comes from and what the app does to it. */
  from: string;
  /** How current it is, and how a reader can tell. */
  fresh: string;
  /** Where a reader meets it. */
  where: string;
}
