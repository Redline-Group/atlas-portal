import type { GraphEntity, RelationEdge } from "@/types";
import { groupBy } from "@/lib/collections";
import { EXEC_EDGES, FAC_EDGES, GOV_EDGES } from "@/lib/roleEdges";
import { isServedSubtype } from "@/lib/agentKinds";
import type { ActorChain, ChainNode } from "./actorTypes";

export const toChainNode = (p: GraphEntity): ChainNode => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  et: p.et,
  st: p.st,
  docId: p.did,
});

function uniqueById(nodes: ChainNode[]): ChainNode[] {
  const seen = new Set<string>();
  return nodes.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
}

/** Role-edge lookups around one entity. Ends that are not known participants are dropped. */
interface RoleWalk {
  /** The entities holding a `kinds` role over `id` (the edges' sources). */
  holders(id: string, kinds: ReadonlySet<string>): GraphEntity[];
  /** The entities `id` holds a `kinds` role over (the edges' targets). */
  subjects(id: string, kinds: ReadonlySet<string>): GraphEntity[];
}

function roleWalk(edges: readonly RelationEdge[], entityById: ReadonlyMap<string, GraphEntity>): RoleWalk {
  const edgesFrom = groupBy(edges, (e) => e.f);
  const edgesTo = groupBy(edges, (e) => e.t);
  const known = (ids: string[]) => ids.map((id) => entityById.get(id)).filter((p): p is GraphEntity => !!p);
  return {
    holders: (id, kinds) => known((edgesTo.get(id) ?? []).filter((e) => kinds.has(e.e)).map((e) => e.f)),
    subjects: (id, kinds) => known((edgesFrom.get(id) ?? []).filter((e) => kinds.has(e.e)).map((e) => e.t)),
  };
}

/**
 * The served agent → executor → facilitator / govops chain an actor sits on.
 * A served agent and an executor read it from their own edges; a facilitator
 * or govops org (and any other actor) reads it through the executors it holds
 * its role over, and stands alone in its own slot when it holds none.
 */
export function buildActorChain(entity: GraphEntity, edges: readonly RelationEdge[], entityById: ReadonlyMap<string, GraphEntity>): ActorChain {
  const walk = roleWalk(edges, entityById);
  const holdersOf = (execs: GraphEntity[], kinds: ReadonlySet<string>) =>
    uniqueById(execs.flatMap((ex) => walk.holders(ex.id, kinds).map(toChainNode)));
  const around = (execs: GraphEntity[]) => ({
    executors: execs.map(toChainNode),
    facilitators: holdersOf(execs, FAC_EDGES),
    govops: holdersOf(execs, GOV_EDGES),
  });
  const self = toChainNode(entity);
  if (entity.et === "agent" && isServedSubtype(entity.st)) {
    return { served: [self], ...around(walk.holders(entity.id, EXEC_EDGES)) };
  }
  if (entity.et === "agent") {
    return { served: walk.subjects(entity.id, EXEC_EDGES).map(toChainNode), ...around([entity]) };
  }
  const ownSlot = entity.et === "facilitator_org" ? "facilitators" : "govops";
  const execs = walk.subjects(entity.id, ownSlot === "facilitators" ? FAC_EDGES : GOV_EDGES);
  const served = uniqueById(execs.flatMap((ex) => walk.subjects(ex.id, EXEC_EDGES)).map(toChainNode));
  const chain = { served, ...around(execs) };
  if (execs.length === 0) chain[ownSlot] = [self];
  return chain;
}
