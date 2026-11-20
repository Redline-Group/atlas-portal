// Paths, flag parsing and small I/O shared by the hand-run atlas CLIs
// (mistakes-sweep.ts, doc-briefings.mjs) and their subcommand modules.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const ROOT = path.resolve(import.meta.dirname, "../..");
export const ATLAS = path.join(ROOT, "vendor/next-gen-atlas");

export const argv = process.argv.slice(2);
export const flag = (name: string) => argv.includes(`--${name}`);
export const opt = (name: string, fallback: string) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

export const readJson = <T>(file: string, fallback: T): T =>
  fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : fallback;

/** The atlas submodule's HEAD, or null for a checkout without git history. */
export function atlasSha(): string | null {
  try {
    return execFileSync("git", ["-C", ATLAS, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}
