import type { AtlasNode, GraphEntity } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import { headingTitles, icdFiling, type IcdFiling } from "@/lib/cousinFiling";
import { parseMeta } from "@/lib/meta";
import { equivalentDoc, insideIcdBelow, titleAt, titleWords } from "./cousinTitles";
import { MAX_COUSINS, rankCousins } from "./cousinRank";
import { isChainWord } from "./cousinPaths";

type Atlas = Pick<AtlasBundle, "docs" | "docNoToId">;

export interface CousinMatch {
  node: AtlasNode;
  agentDocId: string;
  own: boolean;
  completed: boolean;
  kin: boolean;
}

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

// Words that say what an instance is: its name past any "<Chain> - " prefix,
// without filler, chain names or the agent mark.
const FILLER = new Set(["#", "app", "protocol", "the", "and", "of", "for", "via"]);
const kindWords = (atlas: Atlas, name: string) =>
  [...titleWords(atlas.docs, name.slice(name.indexOf(" - ") + 1))].filter((w) => w.length > 2 && !FILLER.has(w) && !isChainWord(w));

// Instances of a multi-instance primitive are cousins when they sit at the same
// venue; failing that (instances filed straight under a status heading, one per
// integrator) when their names share a word that says what they are, so "1inch"
// meets "1inch" and "Sky.money App" meets "Sky.money Open Source Widgets", but
// "Solana Bridge" meets only another bridge. Inside such ICDs, which share one
// template, a field (`nested`) meets the same field in every instance of the
// primitive. `pool` already holds one primitive.
function sameKind(atlas: Atlas, a: { ent: GraphEntity; filing: IcdFiling }, b: { ent: GraphEntity; filing: IcdFiling }, nested: boolean): boolean {
  if (a.filing.kind === "venue" && b.filing.kind === "venue") return a.filing.venue === b.filing.venue;
  if (nested && a.filing.kind === "direct" && b.filing.kind === "direct") return true;
  const words = new Set(kindWords(atlas, a.ent.name));
  return kindWords(atlas, b.ent.name).some((w) => words.has(w));
}

/**
 * Cousins of `target`, which `hit` covers: same primitive and pool, matched as
 * above when the primitive is multi-instance, else one per other prime; ranked
 * and capped by cousinRank.ts.
 */
export function instanceCousins(atlas: Atlas, target: AtlasNode, hit: GraphEntity, pool: GraphEntity[], limit = MAX_COUSINS): CousinMatch[] {
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
    if (multi ? !sameKind(atlas, self, other, relSuffix !== "") : own) continue;
    // A primitive's subtree holds its instances' ICDs, whose docs are another cover's.
    const accept = hit.et === "primitive" ? (d: AtlasNode, under: AtlasNode) => !insideIcdBelow(atlas, d, under) : undefined;
    const node = equivalentDoc(atlas, target, relSuffix, root, accept);
    const kin = !multi || sameKind(atlas, self, other, false);
    if (node) out.push({ node, agentDocId: otherAgent, own, completed: other.filing.completed, kin });
  }
  return rankCousins(atlas.docs, target, out, self.filing.completed, limit);
}
