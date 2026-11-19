import type { SourceSurface } from "./types";

export const AI_SURFACES: readonly SourceSurface[] = [
  {
    name: "Assessments and sweeps",
    from: "A model drafts each OEA task and Risk Rules rating, description and type against a published rubric, and people review them. The Edit Candidates report includes a model sweep for text that may need an edit.",
    fresh: "An assessment shows which model made it, and a rating is marked stale when the Atlas changed after it.",
    where: "The OEA Assessment, Risk Rules and Edit Candidates reports.",
  },
  {
    name: "Chat and its checks",
    from: "Answers, the check beside each citation, the verification chip, conversation titles, and the names and summaries of saved collections.",
    fresh: "Written as the conversation or collection changes.",
    where: "Chat, the Conversations page and the Collections page.",
  },
  {
    name: "Vote-evidence judgments",
    from: "A model decides whether a vote record entry matches a claim when dates and links do not settle it.",
    fresh: "As of the atlas worker's last judgment, shown on the report.",
    where: "Stale Dates rows tagged “via AI”.",
  },
  {
    name: "Document briefings",
    from: "Short model-written summaries of documents, embedded to help rank meaning search. They are never shown.",
    fresh: "Written by the atlas worker.",
    where: "The order of meaning-search results.",
  },
  {
    name: "Reconstructed history",
    from: "Lineage rebuilt with models and human review, explained under History provenance below.",
    fresh: "It describes the period before native git history, so it does not change as the Atlas does.",
    where: "Change history entries marked AI or human.",
  },
];
