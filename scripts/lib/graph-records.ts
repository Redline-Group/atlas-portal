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

/** The entity already holding a slug wins. */
export function entityAdder(entityMap: Map<string, Entity>): AddEntity {
  return (slug, name, entity_type, subtype, defining_doc_id, meta = null) => {
    const existing = entityMap.get(slug);
    if (existing) return existing;
    const ent = makeEntity(slug, name, entity_type, { subtype, defining_doc_id, meta });
    entityMap.set(slug, ent);
    return ent;
  };
}

export function entityMeta(entity: Pick<Entity, "meta">): Meta {
  return parseMetaObject(entity.meta) ?? {};
}

export function patchEntityMeta(entity: Pick<Entity, "meta">, patch: Meta): void {
  entity.meta = JSON.stringify({ ...entityMeta(entity), ...patch });
}

// fragile: doc_no prefix — A.6.1.1
const AGENT_ARTIFACT_RE = /^(A\.6\.1\.1\.\d+)\./;

export const inAgentArtifact = (doc: { doc_no: string }): boolean => AGENT_ARTIFACT_RE.test(doc.doc_no);

export function agentArtifactDoc<D>(doc: { doc_no: string }, docByDocNo: Map<string, D>): D | null {
  const root = doc.doc_no.match(AGENT_ARTIFACT_RE)?.[1];
  return (root ? docByDocNo.get(root) : null) ?? null;
}
