// The finding for one template-divergence reading: word-level distance, the
// severity rule and the row object. The grouping that feeds it lives in
// mistakes-corpus.mjs.

export const MIN_ARTIFACTS = 4;
export const MAX_DIVERGENT_WORDS = 6;

export type Reading = [string, { name: string; root: string; raw: string }[]];

/** Words in `a` that `b` does not have. The readable half of a diff. */
export function uniqueWords(a: string, b: string): string[] {
  const other = new Set(b.split(" "));
  return [...new Set(a.split(" ").filter((w) => w && !other.has(w)))];
}

/**
 * A reference as normalizeForCompare leaves it: a slot marker (`A.6.1.1.*.2.2`)
 * or a doc_no it could not place in the slot space. Both are MADE of digits, so
 * anything that asks "did a number move here" has to strip them first.
 */
const REFERENCE_RE = /a\.[0-9]+(?:\.(?:\*|[0-9]+|var[0-9]+))*/g;

/** The distinct references inside a set of words, in order, for comparison. */
const referencesIn = (words: string[]) => (words.join(" ").match(REFERENCE_RE) ?? []).sort().join("|");

/**
 * Two kinds of divergence are high-confidence defects rather than wording.
 *
 * A real NUMBER moved. It must be asked with references REMOVED: a rewritten
 * slot marker is all digits, so testing the raw words would mark every link
 * divergence high by construction.
 *
 * A reference points at a different SLOT. The template puts the same link in
 * every artifact, so a different target is a routing mistake, not a choice.
 * Comparing the reference SETS, not merely "a unique word holds a reference",
 * keeps `to [x` vs `to[x` -- same target, missing space -- out of this class.
 */
function divergenceSeverity(majorOnly: string[], minorOnly: string[]) {
  const numberMoved = /[0-9]/.test([...majorOnly, ...minorOnly].join(" ").replace(REFERENCE_RE, ""));
  const targetMoved = referencesIn(majorOnly) !== referencesIn(minorOnly);
  return numberMoved || targetMoved ? "high" : "medium";
}

/** Word-level edit distance via LCS -- how far apart two sentences really are. */
export function wordDistance(a: string, b: string): number {
  const A = a.split(" ");
  const B = b.split(" ");
  const dp = Array.from({ length: A.length + 1 }, () => new Uint32Array(B.length + 1));
  for (let i = 1; i <= A.length; i++) {
    for (let j = 1; j <= B.length; j++) {
      dp[i][j] = A[i - 1] === B[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return A.length + B.length - 2 * dp[A.length][B.length];
}

const say = (rows: Reading[1], words: string[]) =>
  `${rows.map((r) => r.name).join(", ")} say "${words.join(" ")}"`;

function buildFinding(slot: string, major: Reading, minor: Reading, majorOnly: string[], minorOnly: string[]) {
  // A slot can have more than one divergent sentence, so the differing word
  // goes in the id: without it the rows collide and the report shows one.
  const tag = (minorOnly[0] ?? majorOnly[0] ?? "").replace(/[^a-z0-9]+/gi, "").slice(0, 12);
  return {
    id: `${slot}#structural${tag ? `-${tag}` : ""}`,
    docNo: slot,
    uuid: null,
    file: "A.6.1.1.* (all prime artifacts)",
    category: "structural",
    severity: divergenceSeverity(majorOnly, minorOnly),
    pass: "deterministic",
    detector: "template-divergence",
    quote: minor[1][0].raw,
    issue:
      `The same sentence at ${slot} does not say the same thing in every Prime Agent artifact: ` +
      `${say(major[1], majorOnly)}, while ${say(minor[1], minorOnly)}. ` +
      "Only visible corpus-wide; no single chunk of the sweep contains both.",
    fix: "",
  };
}

/** The finding for one minority reading against its family's majority, or null. */
export function divergenceFinding(slot: string, major: Reading, minor: Reading) {
  const majorRoots = new Set(major[1].map((m) => m.root));
  const minorRoots = new Set(minor[1].map((m) => m.root));
  // Two READINGS of one sentence are held by different artifacts. When the
  // same artifact appears on both sides these are two different sentences
  // that happen to be similar, and the finding reads absurdly: "Spark says
  // X, while Spark says Y".
  if ([...minorRoots].some((r) => majorRoots.has(r))) return null;
  if (new Set([...majorRoots, ...minorRoots]).size < MIN_ARTIFACTS) return null;
  const changed = wordDistance(major[0], minor[0]);
  if (changed === 0 || changed > MAX_DIVERGENT_WORDS) return null;
  const majorOnly = uniqueWords(major[0], minor[0]);
  const minorOnly = uniqueWords(minor[0], major[0]);
  if (!majorOnly.length && !minorOnly.length) return null; // reordering only
  return buildFinding(slot, major, minor, majorOnly, minorOnly);
}
