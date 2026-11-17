import type { AtlasNode, GraphEntity, RelationEdge } from "@/types";
import { isRelationEdge } from "@/lib/radarRules";
import type { ActorRelation } from "./actorIndex";
import { docIdByDocNo, relationSourceDocs } from "./relationSources";

/**
 * The relationship edges an actor sits on, each with the party at the other end
 * and the documents the edge was read from. An edge whose other end is not a
 * known entity is left out.
 */
export function buildActorRelations(
  edges: readonly RelationEdge[],
  entityId: string,
  entityById: ReadonlyMap<string, GraphEntity>,
  docs: Record<string, AtlasNode>,
): ActorRelation[] {
  const idByDocNo = docIdByDocNo(docs);
  const relations: ActorRelation[] = [];
  for (const e of edges) {
    if (!isRelationEdge(e, entityById)) continue;
    if (e.f !== entityId && e.t !== entityId) continue;
    const dir = e.f === entityId ? ("outbound" as const) : ("inbound" as const);
    const otherId = dir === "outbound" ? e.t : e.f;
    const other = entityById.get(otherId);
    if (!other) continue;
    relations.push({
      edge: e,
      sourceDocs: relationSourceDocs(e.s, idByDocNo),
      direction: dir,
      otherLabel: other.name,
      otherId,
      otherSlug: other.slug ?? null,
      otherEt: other.et ?? null,
    });
  }
  return relations;
}
