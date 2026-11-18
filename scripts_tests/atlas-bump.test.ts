import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

import {
  ATLAS_BUMP_AUTHOR,
  ATLAS_BUMP_GATES,
  ATLAS_BUMP_PATHS,
  isAtlasBump,
  isAtlasBumpPath,
  mergeVerdict,
} from "../scripts/lib/atlas-bump.ts";

const workflow = (file: string) => fs.readFileSync(`.github/workflows/${file}`, "utf8");

// The files of a real bump, Redline-Group/atlas-portal#593 as the bot pushed it.
const BUMP_FILES = [
  ".cache/etherscan/1/0x6605aa120fe8b656482903e7757babf56947e45e.json",
  ".cache/github-prs/385.json",
  ".github/atlas-census-baseline.json",
  "graph-snapshots/__snapshots__/graph.snap.test.ts.snap",
  "public/addresses.json",
  "vendor/next-gen-atlas",
];
const bump = { author: ATLAS_BUMP_AUTHOR, headRef: "atlas-update/a2c3ae3", files: BUMP_FILES };

describe("isAtlasBumpPath", () => {
  it("matches each declared path and the files under a declared directory", () => {
    for (const p of ATLAS_BUMP_PATHS) expect(isAtlasBumpPath(p)).toBe(true);
    expect(isAtlasBumpPath("./.cache/etherscan/8453/0xabc.json")).toBe(true);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(isAtlasBumpPath(".cache/etherscan-old/1/0xabc.json")).toBe(false);
    expect(isAtlasBumpPath("public/addresses.atlas.json")).toBe(false);
    expect(isAtlasBumpPath("vendor/next-gen-atlas-fork")).toBe(false);
  });
});

describe("isAtlasBump", () => {
  it("recognises the bot's bump", () => {
    expect(isAtlasBump(bump)).toBe(true);
  });

  it("is an ordinary pull request once anything else is in it", () => {
    expect(isAtlasBump({ ...bump, files: [...BUMP_FILES, "apps/web/src/components/radar/ActorPau.test.tsx"] })).toBe(false);
    expect(isAtlasBump({ ...bump, files: [...BUMP_FILES, ".github/workflows/ci.yml"] })).toBe(false);
  });

  it("needs the bot as author and a bump branch", () => {
    expect(isAtlasBump({ ...bump, author: "someone" })).toBe(false);
    expect(isAtlasBump({ ...bump, author: undefined })).toBe(false);
    expect(isAtlasBump({ ...bump, headRef: "claude/atlas-update-x" })).toBe(false);
    expect(isAtlasBump({ ...bump, headRef: null })).toBe(false);
  });

  it("never exempts an unreadable diff", () => {
    expect(isAtlasBump({ ...bump, files: [] })).toBe(false);
  });
});

describe("mergeVerdict", () => {
  const ok = (id: number) => ({ id, status: "completed", conclusion: "success" });

  it("is ready when every gate's newest run passed", () => {
    expect(mergeVerdict({ "ci.yml": [ok(1)], "e2e-gate.yml": [ok(2)] })).toEqual({ ready: true });
  });

  it("waits for a gate that has not run or is still running", () => {
    expect(mergeVerdict({ "ci.yml": [ok(1)], "e2e-gate.yml": [] })).toMatchObject({ ready: false, reason: expect.stringMatching(/has not run/) });
    const running = { id: 3, status: "in_progress", conclusion: null };
    expect(mergeVerdict({ "ci.yml": [ok(1), running] })).toMatchObject({ ready: false, reason: expect.stringMatching(/still running/) });
  });

  it("goes by the newest run, so a green re-run clears a red one and a red one holds", () => {
    const red = (id: number) => ({ id, status: "completed", conclusion: "failure" });
    expect(mergeVerdict({ "ci.yml": [red(1), ok(2)] })).toEqual({ ready: true });
    expect(mergeVerdict({ "ci.yml": [ok(1), red(2)] })).toMatchObject({ ready: false, reason: "ci.yml concluded failure" });
  });
});

describe("the workflows agree with the declaration", () => {
  it("atlas-update.yml commits the declared paths, with no hand-kept list beside them", () => {
    const yml = workflow("atlas-update.yml");
    expect(yml).toContain("bun scripts/aux/atlas-bump-paths.ts | xargs git add --");
    expect(yml).not.toMatch(/git add vendor\/next-gen-atlas/);
  });

  it("the paths script prints exactly the declared paths", () => {
    const out = execFileSync("bun", ["scripts/aux/atlas-bump-paths.ts"], { encoding: "utf8" });
    expect(out.trim().split("\n")).toEqual([...ATLAS_BUMP_PATHS]);
  });

  it("atlas-bump-merge.yml triggers on every gate, named as each gate's workflow names itself", () => {
    const trigger = /workflows:\s*\[([^\]]*)\]/.exec(workflow("atlas-bump-merge.yml"))?.[1] ?? "";
    const listed = [...trigger.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(listed).toEqual(ATLAS_BUMP_GATES.map((g) => g.name));
    for (const gate of ATLAS_BUMP_GATES) expect(workflow(gate.file)).toMatch(new RegExp(`^name: ${gate.name}$`, "m"));
  });

  it("the E2E gate is told who opened the pull request and from which branch", () => {
    const yml = workflow("e2e-gate.yml");
    expect(yml).toContain("PR_AUTHOR: ${{ github.event.pull_request.user.login }}");
    expect(yml).toContain("HEAD_REF: ${{ github.event.pull_request.head.ref }}");
  });
});
