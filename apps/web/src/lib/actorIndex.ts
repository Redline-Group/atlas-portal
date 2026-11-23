import type { AtlasNode, GraphEntity, RelationEdge } from "@/types";
import { indexBy } from "@/lib/collections";
import { cmpDocNo } from "@/lib/docNo";
import { AGENT_FAMILIES, UNLISTED_AGENT, agentFamily } from "@/lib/agentKinds";
import type { GraphData } from "./graph";
import type { RewardsAgent } from "@/lib/rewardsTypes";
import type { ActiveDataRow } from "@/lib/activeDataIndex";

import { buildActorRelations } from "./actorRelations";
import { buildActorChain, toChainNode } from "./actorChain";
import { buildActorContact } from "./actorContact";
import { buildActorHoldings } from "./actorHoldings";
import { buildRecommendations } from "./actorRecommendations";
import type { ActorProfile, SidebarActor, SidebarGroup } from "./actorTypes";

export type * from "./actorTypes";

export function buildSidebarActors(
  graph: GraphData,
  docs: Record<string, AtlasNode>,
): SidebarGroup[] {
  const by = (pred: (p: GraphEntity) => boolean): SidebarActor[] =>
    graph.participants
      .filter(pred)
      .sort((a, b) => {
        const da = (a.did && docs[a.did]?.doc_no) ?? "";
        const db = (b.did && docs[b.did]?.doc_no) ?? "";
        return cmpDocNo(da, db);
      })
      .map(toChainNode);
  return [
    ...[...AGENT_FAMILIES, null].map((f) => ({ label: (f ?? UNLISTED_AGENT).plural, actors: by((e) => e.et === "agent" && e.st !== null && agentFamily(e.st) === f) })),
    { label: "Facilitators", actors: by((e) => e.et === "facilitator_org") },
    { label: "GovOps", actors: by((e) => e.et === "govops_org") },
  ].filter((g) => g.actors.length > 0);
}

/** The Active Data rows an actor answers for, one per Active Data doc; a Prime Agent also owns the rows under its name. */
function actorAdRows(entity: GraphEntity, allActiveDataRows: ActiveDataRow[]): ActiveDataRow[] {
  const seenAd = new Set<string>();
  return allActiveDataRows.filter((r) => {
    const hit =
      r.responsibleParty?.id === entity.id ||
      r.facilitator?.id === entity.id ||
      (entity.et === "agent" && entity.st === "prime" && r.agent === entity.name);
    if (!hit || seenAd.has(r.activeDataId)) return false;
    seenAd.add(r.activeDataId);
    return true;
  });
}

/** Both sides of `comprises`: a composite party's members, and the composite a member belongs to (for navigation). */
function actorComposite(
  edges: readonly RelationEdge[],
  entityId: string,
  entityById: ReadonlyMap<string, GraphEntity>,
): Pick<ActorProfile, "comprisesMembers" | "partOfComposite"> {
  const comprisesMembers = edges
    .filter((e) => e.e === "comprises" && e.f === entityId && e.tt === "entity")
    .map((e) => {
      const m = entityById.get(e.t);
      return { name: m?.name ?? e.t.slice(0, 8), slug: m?.slug ?? null };
    });
  const compositeEdge = edges.find((e) => e.e === "comprises" && e.t === entityId && e.ft === "entity");
  const compositeParty = compositeEdge ? entityById.get(compositeEdge.f) : null;
  const partOfComposite = compositeParty ? { name: compositeParty.name, slug: compositeParty.slug ?? null } : null;
  return { comprisesMembers, partOfComposite };
}

export function buildActorProfile(
  slug: string, graph: GraphData, docs: Record<string, AtlasNode>,
  rewardsIndex: { agents: RewardsAgent[] }, allActiveDataRows: ActiveDataRow[],
): ActorProfile | null {
  const entity = graph.participants.find((p) => p.slug === slug);
  if (!entity) return null;
  const definingDoc = entity.did ? (docs[entity.did] ?? null) : null;
  const entityById = indexBy(graph.participants, (e) => e.id);
  const adRows = actorAdRows(entity, allActiveDataRows);
  const rewardsAgent = rewardsIndex.agents.find((a) => a.agentEntity?.id === entity.id) ?? null;
  const relations = buildActorRelations(graph.edges, entity.id, entityById, docs);
  return {
    entity,
    definingDoc,
    chain: buildActorChain(entity, graph.edges, entityById),
    adRows,
    rewardsAgent,
    relations,
    ...buildActorHoldings(graph, docs, definingDoc),
    recommendations: buildRecommendations(entity, adRows, rewardsAgent, relations),
    ...actorComposite(graph.edges, entity.id, entityById),
    contact: buildActorContact(graph.edges, entity.id),
  };
}
