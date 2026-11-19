-- Edit Candidates: things in the Atlas text that may need an edit, found by the
-- atlas worker's sweep (src/server/sync-edit-candidates.ts) and served by
-- GET /api/edit-candidates.
--
-- `key` is sha256 of (document uuid, category, quote), the same triple a review
-- veto is recorded against in public/potential-mistakes.json, so a veto removes
-- its row by key and a re-found candidate keeps its first_seen.
CREATE TABLE IF NOT EXISTS edit_candidates (
  key         TEXT PRIMARY KEY,
  doc_id      UUID,                      -- NULL for a candidate that spans documents
  doc_no      TEXT NOT NULL,             -- as it read when found; the page resolves the live one
  file        TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  severity    TEXT NOT NULL,
  pass        TEXT NOT NULL,
  quote       TEXT NOT NULL,
  issue       TEXT NOT NULL,
  fix         TEXT,
  detector    TEXT,
  source      TEXT NOT NULL CHECK (source IN ('seed', 'worker')),
  model       TEXT,
  first_seen  DATE NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edit_candidates_doc ON edit_candidates (doc_id);

-- Which version of each document was last read. A document is recorded here
-- only when a reply covering it came back whole; `failures` counts replies that
-- did not, at `failed_digest`, so a document that keeps failing is parked
-- instead of spending the budget every cycle.
CREATE TABLE IF NOT EXISTS edit_candidate_docs (
  doc_id         UUID PRIMARY KEY,
  digest         TEXT NOT NULL,          -- '' = never read; the row only carries `failures`
  source         TEXT NOT NULL CHECK (source IN ('seed', 'worker')),
  failures       INT NOT NULL DEFAULT 0,
  failed_digest  TEXT,
  swept_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Model spend per calendar month (UTC, 'YYYY-MM'), which the sweep holds under
-- EDIT_CANDIDATES_MONTHLY_USD.
CREATE TABLE IF NOT EXISTS edit_candidate_spend (
  month     TEXT PRIMARY KEY,
  usd       DOUBLE PRECISION NOT NULL DEFAULT 0,
  requests  INT NOT NULL DEFAULT 0
);

-- sha256 of the committed seed files last loaded, so unchanged files are skipped.
ALTER TABLE sync_state ADD COLUMN IF NOT EXISTS edit_candidates_seed_hash TEXT;

-- The atlas commit the sweep last had nothing left to read at, and the day it
-- got there. A run that stops early (budget, deadline, a failed request) leaves
-- them alone, so the report never claims a commit it has not finished.
ALTER TABLE sync_state ADD COLUMN IF NOT EXISTS edit_candidates_covered_sha TEXT;
ALTER TABLE sync_state ADD COLUMN IF NOT EXISTS edit_candidates_covered_on DATE;
