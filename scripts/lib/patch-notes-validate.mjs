// Strict validator for patch-notes.md.
//
// This is deliberately separate from the frontend parser in
// src/lib/patchNotes.ts: the parser is LENIENT (it silently ignores anything
// it doesn't recognize so the homepage never crashes on a typo), whereas this
// is STRICT (it rejects anything off-format so a typo is caught before commit).
// The two share the shape but not the intent, so they don't share code.
//
// Pure: takes the raw file text, returns an array of human-readable error
// strings (empty array == valid). The CLI wrapper in
// scripts/required/check-patch-notes.mjs handles file IO and exit codes.

const DATE_RE = /^##\s+(\d{4}-\d{2}-\d{2})\s*$/;
const BULLET_RE = /^(\s*)-\s*(.*)$/;

// The homepage shows only the 10 most recent bullets across all dates
// (src/lib/patchNotes.ts), so a date group at or past this size hides every
// earlier date entirely.
const MAX_BULLETS_PER_GROUP = 10;

// True only for a real calendar date in YYYY-MM-DD form (rejects e.g. 2026-13-40).
function isRealDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [, y, mo, d] = m.map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

// Reports an empty or oversized date group when it ends.
function closeGroup(st, errors) {
  if (!st.seenDate) return;
  if (st.curGroupBullets === 0) {
    errors.push(`Line ${st.curGroupLine}: date "${st.prevDate}" has no bullets under it.`);
  } else if (st.curGroupBullets > MAX_BULLETS_PER_GROUP) {
    errors.push(
      `Line ${st.curGroupLine}: date "${st.prevDate}" has ${st.curGroupBullets} bullets — max ${MAX_BULLETS_PER_GROUP} per date (the homepage shows only the 10 most recent bullets, so a larger group hides every earlier date). Condense: one bullet per feature, fold fixes in.`,
    );
  }
}

function checkDateHeading(date, ln, st, errors) {
  closeGroup(st, errors); // the previous group ends here
  if (!isRealDate(date)) {
    errors.push(`Line ${ln}: "${date}" is not a real calendar date.`);
  } else if (st.prevDate && date >= st.prevDate) {
    errors.push(
      `Line ${ln}: date "${date}" must be strictly older than the one above it ("${st.prevDate}"). List newest-first with no duplicates.`,
    );
  }
  st.seenDate = true;
  st.prevDate = date;
  st.curGroupBullets = 0;
  st.curGroupLine = ln;
}

function checkBullet(bulletMatch, ln, st, errors) {
  if (!st.seenDate) {
    errors.push(`Line ${ln}: bullet appears before any "## YYYY-MM-DD" date heading.`);
    return;
  }
  if (bulletMatch[1].length > 0) {
    errors.push(`Line ${ln}: bullet must not be indented.`);
  }
  if (bulletMatch[2].trim() === "") {
    errors.push(`Line ${ln}: empty bullet.`);
  }
  st.curGroupBullets++;
}

function checkLine(line, ln, st, errors) {
  // Comment handling — assumes comments occupy whole lines (as in the seed).
  if (st.inComment) {
    if (line.includes("-->")) st.inComment = false;
    return;
  }
  if (line.includes("<!--")) {
    if (!line.includes("-->")) st.inComment = true;
    return;
  }

  if (line.trim() === "") return; // blank line

  const dateMatch = line.match(DATE_RE);
  if (dateMatch) return checkDateHeading(dateMatch[1], ln, st, errors);

  const bulletMatch = line.match(BULLET_RE);
  if (bulletMatch) return checkBullet(bulletMatch, ln, st, errors);

  // A heading-looking line that isn't a valid date heading.
  if (/^#+\s/.test(line)) {
    errors.push(
      `Line ${ln}: headings must be "## YYYY-MM-DD" (two #, ISO date), got: ${line.trim()}`,
    );
    return;
  }

  errors.push(`Line ${ln}: unrecognized line (expected a date heading or "- bullet"): ${line.trim()}`);
}

export function validatePatchNotes(raw) {
  const errors = [];
  const st = {
    inComment: false, // inside a multi-line <!-- ... --> block
    seenDate: false, // have we opened any date group yet?
    prevDate: null, // previous group's date, for ordering
    curGroupBullets: 0, // bullets seen in the current group
    curGroupLine: 0, // line number of the current group's heading
  };

  raw.split("\n").forEach((line, i) => checkLine(line, i + 1, st, errors));

  closeGroup(st, errors); // close the final group

  if (!st.seenDate) {
    errors.push('No date groups found — expected at least one "## YYYY-MM-DD" heading.');
  }

  return errors;
}
