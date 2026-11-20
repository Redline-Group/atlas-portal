// The Atlas Edit Proposal files committed in the atlas checkout, and the poll-title
// classifier that names which proposal a poll ratifies.
import { readAepFiles } from "./aep-files.ts";

export interface RepoAep {
  aep: number;
  file: string;
  ratification_poll_url: string | null;
  poll_slug: string | null;
}

export function classify(title: string): { kind: string; aep: number | null } {
  const m = title.match(/\(AEP-(\d+)\)/i);
  if (m) return { kind: "monthly", aep: Number(m[1]) };
  if (/weekly/i.test(title)) return { kind: "weekly", aep: null };
  return { kind: "other", aep: null };
}

// Committed AEP files carry the ratification-poll URL (a vote.makerdao.com/polling/<slug>
// where <slug> is the IPFS multiHash prefix) — it cross-links and integrity-checks each poll.
export function readRepoAeps(): RepoAep[] {
  return readAepFiles().map(({ file, aep, field }) => {
    const pollUrl = field("Ratification Poll URL");
    return {
      aep,
      file,
      ratification_poll_url: pollUrl,
      poll_slug: (pollUrl && (pollUrl.match(/polling\/([A-Za-z0-9]+)/) || [])[1]) || null,
    };
  });
}
