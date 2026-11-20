// The Atlas Edit Proposal files committed in the atlas checkout
// (vendor/next-gen-atlas/Atlas Edit Proposals/AEP-<n>.md). Each caller reads
// the front-matter fields it needs through `field`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AEP_DIR = path.resolve(__dirname, "../../../vendor/next-gen-atlas/Atlas Edit Proposals");

export interface AepFile {
  file: string;
  aep: number;
  /** The trimmed value of a `Name: value` line, or null. `name` is a regex source. */
  field: (name: string) => string | null;
}

/** Every AEP file, in directory order. Empty when the submodule is not populated. */
export function readAepFiles(): AepFile[] {
  let files: string[];
  try {
    files = fs.readdirSync(AEP_DIR).filter((f) => /^AEP-\d+\.md$/i.test(f));
  } catch {
    return [];
  }
  return files.map((file) => {
    const txt = fs.readFileSync(path.join(AEP_DIR, file), "utf8");
    return {
      file,
      aep: Number((file.match(/\d+/) || [])[0]),
      field: (name) => (txt.match(new RegExp(`^${name}\\s*:\\s*(.+)$`, "im")) || [])[1]?.trim() || null,
    };
  });
}
