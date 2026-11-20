import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scanSourceUuids } from "../scripts/lib/atlas-uuid-scan.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

const dirs: string[] = [];
function checkout(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uuid-scan-"));
  dirs.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  return dir;
}
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe("scanSourceUuids", () => {
  it("reads frontmatter ids and heading uuids from every markdown file under content/", () => {
    const dir = checkout({
      "content/A/0/document.md": `---\nid: ${A}\n---\n# A.0 - Root [Scope]\n`,
      "content/A.1 - Scope.md": `# A.1 - One [Scope] <!-- UUID: ${B} -->\nbody\n## A.1.1 - Two [Article] <!-- UUID: ${C} -->\n`,
      "content/notes.txt": `id: ${C}\n`,
    });
    const { fileOf, fileCount } = scanSourceUuids(dir);
    expect(fileCount).toBe(2);
    expect(Object.fromEntries(fileOf)).toEqual({ [A]: "document.md", [B]: "A.1 - Scope.md", [C]: "A.1 - Scope.md" });
  });

  it("ignores a uuid that is only quoted in prose", () => {
    const dir = checkout({ "content/x.md": `see id: ${A} and <!-- UUID: ${B} --> inline\n` });
    expect(scanSourceUuids(dir).fileOf.size).toBe(0);
  });

  it("falls back to the monolith when there is no content/, and to nothing when neither exists", () => {
    const mono = checkout({ "Sky Atlas/Sky Atlas.md": `# A.0 - Root [Scope] <!-- UUID: ${A} -->\n` });
    expect(Object.fromEntries(scanSourceUuids(mono).fileOf)).toEqual({ [A]: "Sky Atlas.md" });
    expect(scanSourceUuids(checkout({ "README.md": "x" }))).toEqual({ fileOf: new Map(), fileCount: 0 });
  });
});
