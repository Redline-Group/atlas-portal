import type { AtlasNode, GraphEntity } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import { headingTitles, icdFiling, normTitle, type IcdFiling } from "@/lib/cousinFiling";
import { parseMeta } from "@/lib/meta";
import { byDocNo } from "@/lib/docNo";
import { equivalentDoc, titleAt } from "./cousinTitles";

type Atlas = Pick<AtlasBundle, "docs" | "docNoToId">;

export interface CousinMatch {
  node: AtlasNode;
  agentDocId: string;
  own: boolean;
  completed: boolean;
}

export const MAX_COUSINS = 16;

export const agentOf = (e: GraphEntity) => parseMeta<{ agent_doc_id?: string | null }>(e.m)?.agent_doc_id ?? undefined;

const PRIMITIVE_FILING: IcdFiling = { kind: "direct", completed: false };

function filingOf(atlas: Atlas, ent: GraphEntity): IcdFiling {
  const doc = ent.et === "primitive" || !ent.did ? undefined : atlas.docs[ent.did];
  return doc ? icdFiling(headingTitles(doc.doc_no, (no) => titleAt(atlas, no))) : PRIMITIVE_FILING;
}

// A primitive is multi-instance when some prime holds more than one entity of
// it in this pool (Allocation System, Distribution Reward, Integration Boost).
function isMultiInstance(pool: GraphEntity[], st: string): boolean {
  const seen = new Set<string>();
  for (const e of pool) {
    const agent = e.st === st ? agentOf(e) : undefined;
    if (!agent) continue;
    if (seen.has(agent)) return true;
    seen.add(agent);
  }
  return false;
}

// Instances of a multi-instance primitive are cousins when they sit at the same
// venue, are filed side by side under one prime's status headings, or (failing
// both) carry the same instance name, as "1inch" does under Keel and Skybase.
function sameKind(a: { ent: GraphEntity; filing: IcdFiling }, b: { ent: GraphEntity; filing: IcdFiling }, own: boolean): boolean {
  if (a.filing.kind === "venue" && b.filing.kind === "venue") return a.filing.venue === b.filing.venue;
  if (own && a.filing.kind === "direct" && b.filing.kind === "direct") return true;
  return normTitle(a.ent.name) === normTitle(b.ent.name);
}

/**
 * Cousins of `target`, which `hit` covers: same primitive and pool, matched as
 * above when the primitive is multi-instance, else one per other prime. Same
 * status as the target ranks first, then the target's own prime, capped.
 */
export function instanceCousins(atlas: Atlas, target: AtlasNode, hit: GraphEntity, pool: GraphEntity[]): CousinMatch[] {
  const agentDocId = agentOf(hit);
  const coverDoc = hit.did ? atlas.docs[hit.did] : undefined;
  if (!agentDocId || !coverDoc || !hit.st) return [];
  const relSuffix = target.doc_no.startsWith(`${coverDoc.doc_no}.`) ? target.doc_no.slice(coverDoc.doc_no.length) : "";
  const multi = isMultiInstance(pool, hit.st);
  const self = { ent: hit, filing: filingOf(atlas, hit) };
  const out: CousinMatch[] = [];
  for (const ent of pool) {
    const otherAgent = agentOf(ent);
    const root = ent.did ? atlas.docs[ent.did] : undefined;
    if (ent === hit || ent.st !== hit.st || !otherAgent || !root) continue;
    const own = otherAgent === agentDocId;
    const other = { ent, filing: filingOf(atlas, ent) };
    if (multi ? !sameKind(self, other, own) : own) continue;
    const node = equivalentDoc(atlas, target, relSuffix, root);
    if (node) out.push({ node, agentDocId: otherAgent, own, completed: other.filing.completed });
  }
  return rank(out, self.filing.completed);
}

function rank(matches: CousinMatch[], targetCompleted: boolean): CousinMatch[] {
  const sameStatus = (m: CousinMatch) => Number(m.completed === targetCompleted);
  return matches
    .sort((a, b) => sameStatus(b) - sameStatus(a) || Number(b.own) - Number(a.own) || byDocNo(a.node, b.node))
    .slice(0, MAX_COUSINS);
}
