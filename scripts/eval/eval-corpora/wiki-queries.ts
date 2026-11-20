// Queries for the constraints-wiki card A/B (eval-wiki-ab.ts).
import type { BakeoffQuery } from "../eval-bakeoff-queries.ts";

// Queries chosen to differentiate the card's entries (W-refs in comments), plus four
// reused bakeoff queries that already probe scaffolding/abstention and template shape.
export const WIKI_QUERIES: BakeoffQuery[] = [
  {
    id: "spark-root-edit", // W4
    query: "How can SPK holders change the Spark Agent Artifact? What are the thresholds and review periods?",
    expect:
      "≥1% of circulating supply to propose, 7-day Operational Facilitator alignment review, 3-day Snapshot poll with ≥10% participation and 50% in favor, plus Spark's parallel 7-day Risk Council review — cited from Spark's OWN docs. Quoting Sky Core weekly-cycle thresholds instead is a fail.",
  },
  {
    id: "december-cycle", // W4
    query: "Is there a monthly governance cycle in December? How does the AEP schedule handle it?",
    expect:
      "No Monthly Governance Cycle in December, cited. Good answers also surface the 7-day text freeze and the no-unamended-resubmission rule.",
  },
  {
    id: "emissions-entrenchment", // W5
    query: "Can Spark Governance re-enable token emissions beyond the Genesis Supply?",
    expect:
      "No — permanently disabled and not revertible by Spark Governance; the only override is Sky-held under Risk Capital violation. Cited.",
  },
  {
    id: "immutable-docs-change", // W3
    query: "Can Immutable Documents in the Atlas ever be changed?",
    expect:
      "Yes, through normal governance until the Endgame State is reached; only then do they become truly immutable. ≤3 layers deep. A flat 'never' is a fail.",
  },
  {
    id: "capital-ratio", // W7
    query: "What is the Capital Ratio required by the Atlas and where is it defined?",
    expect: "Exactly 8.75%, with the defining doc cited. Rounding or hedging the number is a fail.",
  },
  {
    id: "keel-rate-limit", // W7/W8
    query: "What is Keel's USDS minting rate limit?",
    expect:
      "The (maxAmount, slope) pair from Keel's own rate-limit doc, cited. Reusing another agent's limit or presenting the template value as Keel-specific without Keel's doc is a fail.",
  },
  {
    id: "lawyer-registry", // W9
    query: "Which approved legal counsels are listed in the Atlas Lawyer Registry?",
    expect:
      "None — the registry doc itself says there are no active legal counsels; a good answer cites that empty doc (grounded abstention). Inventing counsels is a hard fail.",
  },
  {
    id: "atlas-silence", // W11
    query: "What is a Facilitator supposed to do when the Atlas gives no explicit guidance for a situation?",
    expect:
      "Describes the atlas's own meta-rules: extrapolation from the Spirit of the Atlas, Chesterton's Fence, and (for Executor ambiguity) erring on the side of no changes / routing through Root Edit. Inventing a procedure is a fail.",
  },
  {
    id: "reviewer-pr", // W6
    query: "Can a Spell Reviewer contribute code to a spell through a pull request?",
    expect:
      "No — indirect contribution via PRs is separately and explicitly prohibited (distinct from the direct-commit ban). Cited.",
  },
  {
    id: "agent-customizations", // W8
    query: "Have any Prime Agents defined custom routine protocols beyond the Sky Core baseline?",
    expect:
      "No — the customization fence doc says '[No customization presently.]'; a good answer cites it rather than just failing to find customizations.",
  },
];
