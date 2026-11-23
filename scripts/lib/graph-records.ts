// Record shapes the graph build phases hand to each other, and the small
// readers and writers over them that more than one phase needs.
import { parseMetaObject } from "../../src/lib/meta.ts";
import { makeEntity } from "./graph-patterns.mjs";

export interface Doc {
  id: string;
  doc_no: string;
  title: string;
  type?: string;
  content?: string;
}
export type Entity = ReturnType<typeof makeEntity>;
export type Meta = Record<string, unknown>;
export interface Edge {
  fromId: string;
  fromType: string;
  toId: string;
  toType: string;
  edgeType: string;
  sourceDocNos?: string[];
  meta?: string | null;
}
export type AddEntity = (
  slug: string,
  name: string,
  entity_type: string,
  subtype: string | null,
  defining_doc_id: string | null,
  meta?: object | null,
) => Entity;

/** Get-or-create over one registry: the entity already holding a slug wins. */
export function entityAdder(entityMap: Map<string, Entity>): AddEntity {
  return (slug, name, entity_type, subtype, defining_doc_id, meta = null) => {
    const existing = entityMap.get(slug);
    if (existing) return existing;
    const ent = makeEntity(slug, name, entity_type, { subtype, defining_doc_id, meta });
    entityMap.set(slug, ent);
    return ent;
  };
}

/** An entity's meta as an object; an entity without meta reads as {}. */
export function entityMeta(entity: Pick<Entity, "meta">): Meta {
  return parseMetaObject(entity.meta) ?? {};
}

/** Merges `patch` over an entity's meta. Existing keys keep their position. */
export function patchEntityMeta(entity: Pick<Entity, "meta">, patch: Meta): void {
  entity.meta = JSON.stringify({ ...entityMeta(entity), ...patch });
}

// fragile: doc_no prefix — the Prime Agent artifacts root (A.6.1.1)
const AGENT_ARTIFACT_RE = /^(A\.6\.1\.1\.\d+)\./;

/** True for a document inside a Prime Agent artifact subtree (A.6.1.1.N.*). */
export const inAgentArtifact = (doc: { doc_no: string }): boolean => AGENT_ARTIFACT_RE.test(doc.doc_no);

/** The Prime Agent artifact root a document sits under, or null outside one. */
export function agentArtifactDoc<D>(doc: { doc_no: string }, docByDocNo: Map<string, D>): D | null {
  const root = doc.doc_no.match(AGENT_ARTIFACT_RE)?.[1];
  return (root ? docByDocNo.get(root) : null) ?? null;
}
