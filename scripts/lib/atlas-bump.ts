// What an automated atlas bump is, declared once. atlas-update.yml commits
// exactly ATLAS_BUMP_PATHS (it reads them from scripts/aux/atlas-bump-paths.ts),
// the E2E gate passes a pull request that is a bump, and atlas-bump-merge.ts
// merges one once CI is green.
//
// A bump gets no Railway PR environment, and would test nothing new if it did:
// the web image clones upstream atlas main itself, and the worker moves
// production to upstream main without waiting for the pin. So a bump is gated
// by CI (check:atlas, the build, the snapshots, the unit suites), not by E2E.

/** The GitHub App that opens bump pull requests. */
export const ATLAS_BUMP_AUTHOR = "redline-atlas-updater[bot]";

/** Every bump branch is `atlas-update/<short atlas sha>`. */
export const ATLAS_BUMP_BRANCH_PREFIX = "atlas-update/";

/**
 * Everything a bump commits. A directory entry covers the files under it.
 *   - the submodule pointer itself;
 *   - the graph snapshots and census baselines the bump accepts;
 *   - public/addresses.json and .cache/etherscan, refreshed from the chainlog
 *     and explorers so the on-chain artifact keeps pace with docs.json;
 *   - .cache/github-prs, the atlas PR records build:history reads where
 *     nothing can fetch them (an offline `pnpm dev`, the canary job).
 */
export const ATLAS_BUMP_PATHS: readonly string[] = Object.freeze([
  "vendor/next-gen-atlas",
  "graph-snapshots/__snapshots__",
  ".github/atlas-census-baseline.json",
  ".github/govops-census-baseline.json",
  ".github/risk-census-baseline.json",
  ".github/concepts-census-baseline.json",
  ".github/chains-census-baseline.json",
  "public/addresses.json",
  ".cache/etherscan",
  ".cache/github-prs",
]);

export function isAtlasBumpPath(file: string): boolean {
  const norm = String(file).replaceAll("\\", "/").replace(/^\.\//, "");
  return ATLAS_BUMP_PATHS.some((p) => norm === p || norm.startsWith(`${p}/`));
}

export interface PullRequestShape {
  author: string | null | undefined;
  headRef: string | null | undefined;
  files: readonly string[];
}

/**
 * True for a pull request the bump bot opened, on a bump branch, that changes
 * only bump paths. A commit anyone else adds outside those paths makes it an
 * ordinary pull request again, gated like any other. An empty file list is
 * never a bump: an unreadable diff must not exempt anything.
 */
export function isAtlasBump({ author, headRef, files }: PullRequestShape): boolean {
  if (author !== ATLAS_BUMP_AUTHOR) return false;
  if (!headRef?.startsWith(ATLAS_BUMP_BRANCH_PREFIX)) return false;
  return files.length > 0 && files.every(isAtlasBumpPath);
}

/**
 * The workflows a bump must pass before atlas-bump-merge.ts merges it: their
 * files, and the names atlas-bump-merge.yml's workflow_run trigger lists.
 */
export const ATLAS_BUMP_GATES: readonly { file: string; name: string }[] = Object.freeze([
  { file: "ci.yml", name: "CI" },
  { file: "e2e-gate.yml", name: "E2E gate" },
]);

export interface WorkflowRun {
  id: number;
  status: string | null;
  conclusion: string | null;
}

export type MergeVerdict = { ready: true } | { ready: false; reason: string };

/**
 * Whether every named workflow has passed at the bump's head. Only each
 * workflow's newest run counts, so a re-run that went green clears an earlier
 * red, and a newer run still in flight holds the merge.
 */
export function mergeVerdict(runsByWorkflow: Record<string, readonly WorkflowRun[]>): MergeVerdict {
  for (const [workflow, runs] of Object.entries(runsByWorkflow)) {
    const latest = [...runs].sort((a, b) => b.id - a.id)[0];
    if (!latest) return { ready: false, reason: `${workflow} has not run at this commit` };
    if (latest.status !== "completed") return { ready: false, reason: `${workflow} is still running` };
    if (latest.conclusion !== "success") return { ready: false, reason: `${workflow} concluded ${latest.conclusion}` };
  }
  return { ready: true };
}
