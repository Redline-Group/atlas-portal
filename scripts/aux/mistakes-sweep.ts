// Incremental driver for the hand-run Edit Candidates sweep.
//
//   pnpm mistakes:status               what changed since the last sweep
//   pnpm mistakes:bootstrap            adopt the existing sweep as the baseline (one-off)
//   pnpm mistakes:plan  [--full]       write the work plan + chunk files
//   pnpm mistakes:merge [--dry-run]    fold agent output into the artifact
//                       [--drop-corpus] also retire the hand-maintained
//                                       corpus-wide rows (see mergeFindings)
//
// The LLM judgement happens between `plan` and `merge` and is driven by
// .claude/skills/mistakes-report — this script only decides what needs looking
// at and merges what came back. Deliberately OFF the `pnpm build` chain:
// public/potential-mistakes.json is committed data, not a build artifact, and
// the atlas worker seeds from it (src/server/edit-candidates/CLAUDE.md).
//
// Each subcommand is one module under scripts/aux/mistakes-sweep/ and
// returns the process exit code.
import { bootstrap } from "./mistakes-sweep/bootstrap.ts";
import { cmd } from "./mistakes-sweep/context.ts";
import { merge } from "./mistakes-sweep/merge.ts";
import { plan } from "./mistakes-sweep/plan.ts";
import { status } from "./mistakes-sweep/status.ts";

const COMMANDS: Record<string, () => number> = { status, bootstrap, plan, merge };

const run = Object.hasOwn(COMMANDS, cmd) ? COMMANDS[cmd] : undefined;
if (!run) {
  console.error(`unknown command "${cmd}" — expected status | bootstrap | plan | merge`);
  process.exit(1);
}
process.exit(run());
