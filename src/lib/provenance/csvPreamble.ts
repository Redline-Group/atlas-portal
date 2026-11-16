// The comment lines at the top of a report's CSV export. The filename already
// carries the Atlas commit; the preamble carries the rest of what the page said
// about its sources, so a saved file is not mistaken for plain Atlas text.
//
// Every line starts with "#". Readers that parse the file as data skip them
// with a comment option (pandas `comment="#"`); a spreadsheet shows them as rows.
import { SOURCE_CLASSES, normalizeSources, type SourceClass } from "./sources";

export interface CsvPreambleInput {
  title: string;
  sources: readonly SourceClass[];
  /** The atlas commit the export was taken from; absent in dev. */
  sha: string | null;
  exportedAt: Date;
}

export function csvPreamble({ title, sources, sha, exportedAt }: CsvPreambleInput): string {
  const classes = normalizeSources(sources);
  const lines = [
    `# Redline Portal: ${title}`,
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
  return `${lines.join("\n")}\n`;
}
