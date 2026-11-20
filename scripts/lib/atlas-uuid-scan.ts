// Every document uuid in an atlas checkout and the file that holds it, found
// WITHOUT asking the loader. Deliberately dumb and layout-blind: a loader that
// mis-reads a layout would agree with itself, so the merge gate (check:atlas)
// and the Edit Candidates `Source File` column both read the source this way.
import fs from "node:fs";
import path from "node:path";

// The two forms that define a document, in every layout the atlas has shipped:
//   atomized      frontmatter `id: <uuid>` (the heading carries no uuid)
//   consolidated  a heading line ending `<!-- UUID: <uuid> -->`
//   monolith      same heading form, in one file
// Both are line-anchored, so a uuid merely quoted in prose cannot match.
const FRONTMATTER_ID_RE = /^id: ([0-9a-f-]{36})$/;
const HEADING_UUID_RE = /^#{1,6} .+<!-- UUID: ([0-9a-f-]{36}) -->\s*$/;

/** Every markdown file under `content/`, or the monolith when there is no `content/`. */
function markdownFiles(srcDir: string): string[] {
  const files: string[] = [];
  const contentRoot = path.join(srcDir, "content");
  if (fs.existsSync(contentRoot)) {
    const stack = [contentRoot];
    while (stack.length) {
      for (const e of fs.readdirSync(stack.pop()!, { withFileTypes: true })) {
        const full = path.join(e.parentPath ?? (e as unknown as { path: string }).path, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.name.endsWith(".md")) files.push(full);
      }
    }
  } else {
    const monolith = path.join(srcDir, "Sky Atlas/Sky Atlas.md");
    if (fs.existsSync(monolith)) files.push(monolith);
  }
  return files;
}

/** uuid → the basename of the source file it is defined in, and how many files were read. */
export function scanSourceUuids(srcDir: string): { fileOf: Map<string, string>; fileCount: number } {
  const fileOf = new Map<string, string>();
  const files = markdownFiles(srcDir);
  for (const f of files) {
    const name = path.basename(f);
    for (const line of fs.readFileSync(f, "utf8").split("\n")) {
      const m = FRONTMATTER_ID_RE.exec(line) ?? HEADING_UUID_RE.exec(line);
      if (m) fileOf.set(m[1]!, name);
    }
  }
  return { fileOf, fileCount: files.length };
}
