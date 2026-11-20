/**
 * Bridge validator set extraction (Pattern 21) for build-graph.
 *
 * Cross-chain bridges document their validator configuration as a parent doc
 * (the bridge-component root) with a regular pair of child Cores:
 *   …Validators           "The validators for the {Component} are A, B, and C."
 *   …Quorum Requirement   "The quorum requirement for the {Component} is M/N."
 *
 * Two shapes carry the pair today:
 *   SkyLink (A.1.10.4.1.*): "{Network} SkyLink Bridge" → … → "Validators" →
 *     "{Token|Governance} Bridge" (root) → pair
 *   SLL Governance Bridge:
 *     "Governance Bridge Validators" hub → "{Network}" (root) → pair
 *
 * Detection keys on the CHILD PAIR — both sentences must parse — never on
 * titles alone: "Quorum Requirement" also appears as Root Edit Primitive spec
 * prose with no roster sibling (A.2.2.6.*), which must not match.
 *
 * Emits one `bridge` entity per root (id = root doc UUID) plus:
 *   validator_of    ecosystem_actor(st=bridge_validator) → bridge
 *   defines_entity  root doc → bridge
 * The quorum lives on the bridge meta; meta.quorum_doc_no carries provenance
 * so the census counts the quorum doc as covered (same mechanism as the
 * multisig threshold_doc_no fix).
 *
 * Never-silent: a pair whose subjects disagree, or a roster that yields no
 * names, reports a warning instead of dropping data silently.
 */

import { slugify, normalizeKey, buildNameIndex, makeWarn, groupChildrenByParent } from "./graph-patterns.mjs";
import { parseNameList } from "./graph-content-extract.ts";
import { bridgeDisplayName, type Doc } from "./graph-bridge-name.ts";

interface Entity { id: string }
interface Edge { fromId: string; fromType: string; toId: string; toType: string; edgeType: string; sourceDocNos: string[] }
type AddEntity = (
  slug: string,
  name: string,
  entityType: string,
  subtype: string | null,
  definingDocId: string | null,
  meta: Record<string, unknown>,
) => Entity;
type Slot = { roster?: Doc; quorum?: Doc };
type Warn = (msg: string) => void;
interface Pair { roster: Doc; quorum: Doc; subject: string; quorumSubject: string; quorumValue: string; rosterNames: string }
/** What one run threads through every pair: the lookups, the sinks and the counters. */
interface Ctx {
  docByDocNo: Map<string, Doc>;
  entityMap: Map<string, Entity>;
  nameIndex: Map<string, Entity>;
  edges: Edge[];
  addEntity: AddEntity;
  stats: { roots: number; validatorEdges: number; created: number; warnings: number };
  warn: Warn;
}

const ROSTER_RE = /The validators for the (.+?) are (.+?)\./;
const QUORUM_RE = /The quorum requirement for the (.+?) is (\d+)\/(\d+)/;

function childKind(title: string): "roster" | "quorum" | null {
  const t = title.trim();
  if (/^validators$/i.test(t)) return "roster";
  if (/^quorum requirement$/i.test(t)) return "quorum";
  return null;
}

// Both sentences of a slot, parsed. A pair of containers / spec prose parses
// neither and is skipped silently; a half-parsed pair warns.
function parsePair(parentDocNo: string, slot: Slot, warn: Warn): Pair | null {
  if (!slot.roster || !slot.quorum) return null;
  const rosterMatch = (slot.roster.content ?? "").match(ROSTER_RE);
  const quorumMatch = (slot.quorum.content ?? "").match(QUORUM_RE);
  if (!rosterMatch && !quorumMatch) return null;
  if (!rosterMatch || !quorumMatch) {
    warn(`pair at ${parentDocNo} only half-parsed (roster: ${!!rosterMatch}, quorum: ${!!quorumMatch})`);
    return null;
  }
  return {
    roster: slot.roster,
    quorum: slot.quorum,
    subject: rosterMatch[1].trim(),
    quorumSubject: quorumMatch[1].trim(),
    quorumValue: `${quorumMatch[2]}/${quorumMatch[3]}`,
    rosterNames: rosterMatch[2],
  };
}

function addBridgeEntity(ctx: Ctx, root: Doc, pair: Pair): Entity | null {
  const { displayName, network } = bridgeDisplayName(root, pair.subject, ctx.docByDocNo);
  const slug = slugify(displayName);
  if (ctx.entityMap.has(slug)) {
    ctx.warn(`slug collision, skipped: ${root.doc_no} (${slug})`);
    return null;
  }
  const ent = ctx.addEntity(slug, displayName, "bridge", null, root.id, {
    source: "bridge_pattern",
    component: pair.subject,
    network,
    quorum: pair.quorumValue,
    quorum_doc_no: pair.quorum.doc_no,
  });
  ent.id = root.id; // doc UUID is the entity id, like instances and multisigs
  ctx.edges.push({
    fromId: root.id, fromType: "doc", toId: ent.id, toType: "entity",
    edgeType: "defines_entity", sourceDocNos: [],
  });
  return ent;
}

function linkValidators(ctx: Ctx, ent: Entity, pair: Pair): void {
  const names = parseNameList(pair.rosterNames);
  if (!names.length) ctx.warn(`roster yielded no names: ${pair.roster.doc_no}`);
  for (const name of names) {
    let v = ctx.nameIndex.get(normalizeKey(name));
    if (!v) {
      v = ctx.addEntity(slugify(name), name, "ecosystem_actor", "bridge_validator", null, {
        source: "bridge_validator",
        source_doc_no: pair.roster.doc_no,
      });
      ctx.nameIndex.set(normalizeKey(name), v);
      ctx.stats.created++;
    }
    ctx.edges.push({
      fromId: v.id, fromType: "entity", toId: ent.id, toType: "entity",
      edgeType: "validator_of", sourceDocNos: [pair.roster.doc_no],
    });
    ctx.stats.validatorEdges++;
  }
}

function extractPair(ctx: Ctx, parentDocNo: string, slot: Slot): void {
  const pair = parsePair(parentDocNo, slot, ctx.warn);
  if (!pair) return;
  const root = ctx.docByDocNo.get(parentDocNo);
  if (!root) return ctx.warn(`no root doc for pair at ${parentDocNo}`);
  ctx.stats.roots++;
  if (normalizeKey(pair.subject) !== normalizeKey(pair.quorumSubject)) {
    ctx.warn(`subject mismatch at ${parentDocNo}: "${pair.subject}" vs "${pair.quorumSubject}"`);
  }
  const ent = addBridgeEntity(ctx, root, pair);
  if (ent) linkValidators(ctx, ent, pair);
}

export function extractBridges(
  allDocs: Doc[],
  _docById: Map<string, Doc>,
  docByDocNo: Map<string, Doc>,
  entityMap: Map<string, Entity>,
  edges: Edge[],
  addEntity: AddEntity,
) {
  const stats = { roots: 0, validatorEdges: 0, created: 0, warnings: 0 };
  const warn = makeWarn("  bridge:", stats);
  const ctx: Ctx = { docByDocNo, entityMap, nameIndex: buildNameIndex(entityMap), edges, addEntity, stats, warn };

  // Group candidate children by parent doc_no (slot shape: { roster?, quorum? }).
  // Container docs also titled "Validators" ("The documents herein specify…")
  // never match ROSTER_RE, so they cannot complete a pair.
  const byParent = groupChildrenByParent(allDocs, (d) => childKind(d.title));
  for (const [parentDocNo, slot] of [...byParent.entries()].sort()) extractPair(ctx, parentDocNo, slot);

  return stats;
}
