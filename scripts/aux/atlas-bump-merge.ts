// Merges an atlas bump pull request once CI and the E2E gate have passed at its
// head. Run by .github/workflows/atlas-bump-merge.yml whenever either workflow
// completes on a bump branch, so whichever finishes last does the merge.
//
// A bump never gets the Railway deployment branch protection requires (see
// scripts/lib/atlas-bump.ts), so auto-merge waits on it forever. The bump App
// is a bypass actor on the ruleset holding that requirement, and merging as the
// App applies the bypass; every other required check still has to pass, which
// is why this waits for them rather than merging at once.
//
// Anything that is not a pure bump at the commit that triggered the run is left
// alone, with a line saying why, and the run still succeeds: a new push, a
// human commit, or a red check all leave the pull request to its normal gates.
import { politeFetch } from "../../src/lib/upstreamBackoff.ts";
import { ATLAS_BUMP_GATES, isAtlasBump, mergeVerdict, type WorkflowRun } from "../lib/atlas-bump.ts";

const repo = process.env.GITHUB_REPOSITORY ?? "";
const headSha = process.env.HEAD_SHA ?? "";
const headBranch = process.env.HEAD_BRANCH ?? "";
const token = process.env.GH_TOKEN ?? "";
const apiBase = (process.env.GITHUB_API_URL ?? "https://api.github.com").replace(/\/+$/, "");

async function github(path: string, init: RequestInit = {}): Promise<Response> {
  return politeFetch(`${apiBase}/repos/${repo}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "redlens-atlas-bump-merge",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

async function json<T>(path: string): Promise<T> {
  const res = await github(path);
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText} for ${path}`);
  return (await res.json()) as T;
}

interface PullRequest {
  number: number;
  merged?: boolean;
  user: { login: string } | null;
  head: { ref: string; sha: string };
}

async function changedFiles(pr: number): Promise<string[]> {
  const files: string[] = [];
  for (let page = 1; ; page++) {
    const batch = await json<{ filename: string }[]>(`/pulls/${pr}/files?per_page=100&page=${page}`);
    files.push(...batch.map((f) => f.filename));
    if (batch.length < 100) return files;
  }
}

async function runsAt(workflow: string): Promise<WorkflowRun[]> {
  const body = await json<{ workflow_runs?: WorkflowRun[] }>(`/actions/workflows/${workflow}/runs?head_sha=${headSha}&per_page=100`);
  return body.workflow_runs ?? [];
}

/** Why this run should not merge, or null when the bump is ready. */
async function holdReason(pr: PullRequest | undefined): Promise<string | null> {
  if (!pr) return `no open pull request for ${headBranch}`;
  if (pr.head.sha !== headSha) return `#${pr.number} has moved on to ${pr.head.sha.slice(0, 7)}`;
  const files = await changedFiles(pr.number);
  if (!isAtlasBump({ author: pr.user?.login, headRef: pr.head.ref, files })) {
    return `#${pr.number} is not a pure atlas bump; it merges through the normal checks`;
  }
  const runs = Object.fromEntries(await Promise.all(ATLAS_BUMP_GATES.map(async ({ file }) => [file, await runsAt(file)] as const)));
  const verdict = mergeVerdict(runs);
  return verdict.ready ? null : `#${pr.number} is not ready: ${verdict.reason}`;
}

async function merge(pr: number): Promise<void> {
  const res = await github(`/pulls/${pr}/merge`, { method: "PUT", body: JSON.stringify({ merge_method: "rebase", sha: headSha }) });
  if (res.ok) return console.log(`Merged #${pr} at ${headSha.slice(0, 7)}.`);
  const after = await json<PullRequest>(`/pulls/${pr}`);
  if (after.merged) return console.log(`#${pr} was already merged.`);
  throw new Error(
    `GitHub refused to merge #${pr} (${res.status}): ${await res.text()}\n` +
      "If the refusal names a required deployment or check, the bump App is not a bypass actor on the ruleset that requires it.",
  );
}

if (!repo || !headSha || !headBranch || !token) {
  console.error("GITHUB_REPOSITORY, HEAD_SHA, HEAD_BRANCH and GH_TOKEN are required");
  process.exit(1);
}
const owner = repo.split("/")[0];
const [pr] = await json<PullRequest[]>(`/pulls?state=open&head=${encodeURIComponent(`${owner}:${headBranch}`)}`);
const hold = await holdReason(pr);
if (hold) console.log(`Not merging: ${hold}.`);
else await merge(pr.number);
