// The comment lines at the top of a report's CSV export. The filename already
// carries the Atlas commit; the preamble carries the rest of what the page said
// about its sources, so a saved file is not mistaken for plain Atlas text.
//
// Each line is one quoted CSV field starting with "#", so a spreadsheet shows a
// single cell per line instead of splitting it at a comma. The first line says
// how many lines the note takes, for a reader that skips them by count (pandas
// `skiprows=N`); a comment option such as `comment="#"` would also cut a data
// row at the first "#" in one of its cells, so the count is the safe way.
import { SOURCE_CLASSES, normalizeSources, type SourceClass } from "./sources";

export interface CsvPreambleInput {
  title: string;
  sources: readonly SourceClass[];
  /** The atlas commit the export was taken from; absent in dev. */
  sha: string | null;
  exportedAt: Date;
}

const field = (line: string): string => `"${line.replace(/"/g, '""')}"`;

export function csvPreamble({ title, sources, sha, exportedAt }: CsvPreambleInput): string {
  const classes = normalizeSources(sources);
  const lines = [
    "",
    `# Atlas commit: ${sha ? sha.slice(0, 8) : "unknown"}. Exported ${exportedAt.toISOString().slice(0, 16)}Z.`,
  ];
  if (classes.length === 0) {
    lines.push("# Source: Atlas text only.");
  } else {
    lines.push("# This report is not only Atlas text. It also draws on:");
    for (const id of classes) {
      const c = SOURCE_CLASSES[id];
      lines.push(`#   ${c.glyph} ${c.word}: ${c.meaning} ${c.caveat}`);
    }
  }
  lines[0] = `# Redline Portal: ${title} (${lines.length} note lines, then the column headings)`;
  return `${lines.map(field).join("\n")}\n`;
}
