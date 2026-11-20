// The Atlas Edit Proposal files committed in the atlas checkout, and the poll-title
// classifier that names which proposal a poll ratifies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AEP_DIR = path.resolve(__dirname, "../../../vendor/next-gen-atlas/Atlas Edit Proposals");

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
  let files: string[];
  try {
    files = fs.readdirSync(AEP_DIR).filter((f) => /^AEP-\d+\.md$/i.test(f));
  } catch {
    return [];
  }
  const field = (txt: string, name: string) => (txt.match(new RegExp(`^${name}\\s*:\\s*(.+)$`, "im")) || [])[1]?.trim() || null;
  return files.map((f) => {
    const txt = fs.readFileSync(path.join(AEP_DIR, f), "utf8");
    const pollUrl = field(txt, "Ratification Poll URL");
    return {
      aep: Number((f.match(/\d+/) || [])[0]),
      file: f,
      ratification_poll_url: pollUrl,
      poll_slug: (pollUrl && (pollUrl.match(/polling\/([A-Za-z0-9]+)/) || [])[1]) || null,
    };
  });
}
