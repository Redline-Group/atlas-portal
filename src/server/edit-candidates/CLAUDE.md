# Edit Candidates: the worker sweep

The Edit Candidates report (`/reports/edit-candidates`) lists things in the Atlas that may need an edit. Its text-sweep rows are written by a model the atlas worker runs. This directory is that sweep: `pnpm sync:edit-candidates` (`src/server/sync-edit-candidates.ts`), the tail lane `edit-candidates` in `scripts/lib/worker-steps/tail.mjs`, and `GET /api/edit-candidates`. The page's other sources (Stale Dates, the PAU audit) are computed in the browser; each is one entry in `apps/web/src/lib/editCandidates/registry.ts`, and a new source is one file there plus one line. The page reads this API first and falls back to the committed file when it answers 503.

Internal names still say "mistakes" (`public/potential-mistakes.json`, `scripts/lib/mistakes-sweep.mjs`, the `mistakes:*` commands, the `Mistake` types). "Edit Candidates" is the public name.

## Three passes, one advisory lock

1. **Seed** loads the committed, reviewed sweep (`public/potential-mistakes.json` and `.github/mistakes-sweep-state.json`) when the hash of the two files changes.
   - The file speaks for a document until the worker has read a version the file has not (`seedApplies`, `seed.ts`). A file row for the live version is a reviewed hand run and replaces the worker's rows; one for an older version leaves them alone.
   - Candidates that span documents (`uuid: null`) come only from the file and are replaced whole on every seed.
2. **Veto** deletes every stored candidate whose (uuid, category, quote) is in the file's `rejected` list, on every run. A candidate the file's own `findings` list carries under the same key is kept: a review accepted it after rejecting another reading of the same passage.
3. **Sweep** reads new and changed documents, and unchanged ones that link to something that moved, with `EDIT_CANDIDATES_MODEL`.

## Rules the sweep holds

- **A document is recorded as read only when a whole, parseable reply covered it.** A failed or cut-off request records nothing, counts one failure for each of its documents and ends the run. After `MAX_FAILURES` at the same version a document is parked until it changes, and the run logs a `[drift]` line.
- **A row is kept only when** it names a document the request asked about, its quote is a literal substring of that document, its category is in `CATEGORIES`, and it is not vetoed (`validRows`, `sweep.ts`). The `pass` is derived from the category.
- **Re-reading a document replaces its candidates**, so one fixed upstream disappears. A candidate found again keeps its `first_seen` (`replace`, `store-pg.ts`); the report's "First found" filter reads it.
- **Reading order is whole groups of (citers, target)** (`queue.ts`). A citer is due only while its target reads as moved, so a run that stops early must never have read a target without its citers. A removed document keeps its record until every citer has been read.
- **The month's spend stays under `EDIT_CANDIDATES_MONTHLY_USD`** (default 5). Requests run one at a time; each starts only if the month's recorded spend plus `EDIT_CANDIDATES_RESERVE_USD` fits, and records the cost OpenRouter reports. A request that may have been charged but reported no cost is charged the reserve. Spend is kept per UTC month in `edit_candidate_spend`.
- **An outage is not a failure.** A request the provider cannot have charged for (an HTTP error, a refused connection, a 200 with no choices) costs nothing and counts against no document; the run ends and the next cycle tries again. Only a timeout, a cut-off reply or an unparseable one is charged and counted.
- **The report names a commit as covered only when a run ended with nothing left to read** (`markCovered`). A run stopped by the budget, the deadline or a failure leaves the last covered commit and day in place, and `GET /api/edit-candidates` serves those as `atlasSha` and `generatedAt`.
- It is off under `ATLAS_WORKER_NO_FETCH=1` and in PR environments (`skipWhenInert`), with an empty model, or with a per-cycle count or budget of 0. Seed and veto still run under `--no-fetch`.

## The prompt is measured

`prompt.ts` holds the instructions and the chunk layout: each queued document with its ancestor titles, then a `CONTEXT ONLY` block with its parent, the documents it links to and its nearest siblings, clipped. `pnpm eval:edit-candidates --context` sends exactly these chunks and scores them against the reviewed sweep, so change the prompt or the context budget only with a fresh eval run.

- Gemini 4 Carbon with context recovers 175 of 274 reviewed findings, against 133 with each document alone; the gain is in the factual categories (71 of 137 against 39). It costs about $3.90 per 1,000 documents read.
- Gemini 4 Hydrogen and Claude Opus 5.5 recover fewer (118 and 98, documents alone).
- A decision-model screen in front of it (Jev, Gemini Decision 1, GPT-6 Luna Decisions, Liquid d1.2-ultra) is not used: at 90% recall the best still passes more than half of the clean documents.

## Review

A veto is a row in the committed file's `rejected` list, with `rejectedReason`, `rejectedOn`, `rejectedIn` and `rejectedBy` (`.claude/skills/mistakes-report/SKILL.md`). It takes effect on the worker's next run after the commit deploys. The hand-run `mistakes:plan` / `mistakes:merge` cycle remains the way to re-sweep the whole corpus, which the monthly budget does not cover.

SQL here follows the `postgres-jsonb` skill: uuid arrays bind as literals with `::uuid[]`, counts are cast `::int`, dates are read as `::text`. The unit tests run against `fake-store.ts`, so a change to `store-pg.ts` or `read.ts` needs a run against a real Postgres.
