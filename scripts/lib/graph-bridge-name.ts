// Display naming for a bridge entity, qualified from the root document’s ancestry.
import { normalizeKey } from "./graph-patterns.mjs";

export interface Doc { id: string; doc_no: string; title: string; content?: string }

// Nearest ancestor titled "…Bridge" whose title is not the subject itself.
function bridgeSystem(parentDocNo: string, subject: string, docByDocNo: Map<string, Doc>): string | null {
  for (let dn = parentDocNo; dn.includes(".");) {
    dn = dn.split(".").slice(0, -1).join(".");
    const anc = docByDocNo.get(dn);
    if (anc && /bridge$/i.test(anc.title.trim()) && normalizeKey(anc.title) !== normalizeKey(subject)) {
      return anc.title.trim();
    }
  }
  return null;
}

// Display name: the sentence subject collides across deployments
// ("Governance Bridge" exists per network), so qualify from ancestry —
// nearest ancestor titled "…Bridge" (SkyLink shape), else the root title
// when it differs from the subject (SLL shape: root is the network doc),
// agent-prefixed under the A.6.1.1.X subtree (like Pattern 17).
export function bridgeDisplayName(root: Doc, subject: string, docByDocNo: Map<string, Doc>) {
  const system = bridgeSystem(root.doc_no, subject, docByDocNo);
  const network = normalizeKey(root.title) !== normalizeKey(subject) ? root.title.trim() : null;
  let displayName = subject;
  if (system) displayName = `${subject} (${system})`;
  else if (network) displayName = `${subject} (${network})`;
  const agentDoc = docByDocNo.get(root.doc_no.match(/^(A\.6\.1\.1\.\d+)\./)?.[1] ?? "");
  if (agentDoc) displayName = `${agentDoc.title} ${displayName}`;
  return { displayName, network };
}
