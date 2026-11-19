// Gold cases for the edit-candidates eval (./eval-edit-candidates.ts), read
// from the reviewed sweep artifact: a document with an accepted finding is a
// `defect`, one whose every finding a review rejected is `vetoed`, and a swept
// document with neither is `clean`. Clean is the weakest label: the sweep may
// have missed something there.
import crypto from "node:crypto";
import { quoteInDoc } from "../../src/lib/mistakeQuote.ts";
import type { AtlasNode as FullNode } from "../../src/types.ts";

type AtlasNode = Pick<FullNode, "id" | "doc_no" | "title" | "type" | "content">;

export interface GoldFinding {
  category: string;
  severity: string;
  pass: string;
  quote: string;
}
export type GoldLabel = "defect" | "vetoed" | "clean";
export interface GoldCase {
  uuid: string;
  label: GoldLabel;
  docNo: string;
  title: string;
  type: string;
  text: string;
  /** Titles of the documents above this one, outermost first. */
  path: string[];
  findings: GoldFinding[];
  vetoes: GoldFinding[];
}
interface Row extends GoldFinding {
  uuid: string | null;
  docNo: string;
}
export interface Artifact {
  findings: Row[];
  rejected?: Row[];
}

/** Rows grouped by document, keeping only quotes the checked-out atlas still holds. */
function liveRows(rows: readonly Row[], byUuid: Map<string, AtlasNode>): Map<string, GoldFinding[]> {
  const out = new Map<string, GoldFinding[]>();
  for (const r of rows) {
    const doc = r.uuid ? byUuid.get(r.uuid) : undefined;
    if (!r.uuid || !doc || !quoteInDoc(r.quote, r.docNo, doc as FullNode)) continue;
    out.set(r.uuid, [...(out.get(r.uuid) ?? []), { category: r.category, severity: r.severity, pass: r.pass, quote: r.quote }]);
  }
  return out;
}

// Ancestors come from doc-number arithmetic: parentId stops at the heading depth cap.
function ancestorTitles(doc: AtlasNode, byDocNo: Map<string, AtlasNode>): string[] {
  const out: string[] = [];
  for (let no = doc.doc_no; no.includes("."); ) {
    no = no.slice(0, no.lastIndexOf("."));
    const parent = byDocNo.get(no);
    if (parent) out.unshift(parent.title);
  }
  return out;
}

const hashOrder = (uuid: string): string => crypto.createHash("sha256").update(uuid).digest("hex");

/** Every defect and vetoed document, plus the first `cleanN` clean ones in hash order. */
export function buildGold(nodes: readonly AtlasNode[], artifact: Artifact, swept: ReadonlySet<string>, cleanN: number): GoldCase[] {
  const byUuid = new Map(nodes.map((n) => [n.id, n]));
  const byDocNo = new Map(nodes.map((n) => [n.doc_no, n]));
  const findings = liveRows(artifact.findings, byUuid);
  const vetoes = liveRows(artifact.rejected ?? [], byUuid);
  const touched = new Set([...artifact.findings, ...(artifact.rejected ?? [])].map((r) => r.uuid));
  const clean = nodes
    .filter((n) => swept.has(n.id) && !touched.has(n.id) && n.content.trim().length > 0)
    .sort((a, b) => hashOrder(a.id).localeCompare(hashOrder(b.id)))
    .slice(0, cleanN);
  const pick = [...new Set([...findings.keys(), ...vetoes.keys()])].map((u) => byUuid.get(u)!).concat(clean);
  return pick.map((doc) => ({
    uuid: doc.id,
    label: findings.has(doc.id) ? "defect" : vetoes.has(doc.id) ? "vetoed" : "clean",
    docNo: doc.doc_no,
    title: doc.title,
    type: doc.type,
    text: doc.content,
    path: ancestorTitles(doc, byDocNo),
    findings: findings.get(doc.id) ?? [],
    vetoes: vetoes.get(doc.id) ?? [],
  }));
}
