// uuid → the source file the document lives in, found WITHOUT asking the
// loader — the same deliberately dumb, layout-blind scan check:atlas uses, for
// the same reason: this is the value shown as `Source File` in the report's
// CSV, and a loader that mis-parses a layout would agree with itself.
import fs from "node:fs";
import path from "node:path";

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

export function sourceFiles(srcDir: string): Map<string, string> {
  const byUuid = new Map<string, string>();
  for (const f of markdownFiles(srcDir)) {
    const name = path.basename(f);
    for (const line of fs.readFileSync(f, "utf8").split("\n")) {
      const m = FRONTMATTER_ID_RE.exec(line) ?? HEADING_UUID_RE.exec(line);
      if (m) byUuid.set(m[1]!, name);
    }
  }
  return byUuid;
}
