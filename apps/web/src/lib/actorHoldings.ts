import type { AtlasNode, GraphEntity } from "@/types";
import { groupBy } from "@/lib/collections";
import { cmpDocNo } from "@/lib/docNo";
import { parseMeta } from "@/lib/meta";
import type { GraphData } from "@/lib/graphData";
import type { InstanceMeta, InvocationMeta } from "@/lib/rewardsTypes";
import { EXCLUDED_INSTANCE_TYPES, buildInstanceOfMap, buildStatusDocMap } from "@/lib/radarRules";
import { toRadarInstance } from "./radarInstance";
import type { ActorProfile, RadarInstance, RadarPrimitive } from "./actorTypes";

type Docs = Record<string, AtlasNode>;
type Holdings = Pick<ActorProfile, "instances" | "invocations" | "primitives">;

interface PrimitiveMeta {
  agent_doc_id: string;
  primitive_category_doc_id: string | null;
  status: string | null;
  is_unknown_primitive?: boolean;
}

/** The instances or invocations (`icds`) declared under the agent whose defining doc is `agentDocId`. */
function agentIcds(icds: GraphEntity[], agentDocId: string, docs: Docs, instanceOfMap: ReadonlyMap<string, string>): RadarInstance[] {
  const out: RadarInstance[] = [];
  for (const icd of icds) {
    if (!icd.m || !icd.st || EXCLUDED_INSTANCE_TYPES.has(icd.st)) continue;
    const meta = parseMeta<InstanceMeta | InvocationMeta>(icd.m);
    if (!meta || meta.agent_doc_id !== agentDocId) continue;
    out.push(toRadarInstance(icd, meta, docs, instanceOfMap));
  }
  return out;
}

/** A primitive's own fields; its category sorts by the last segment of the category's doc number. */
function primitiveFields(p: GraphEntity, st: string, meta: PrimitiveMeta, docs: Docs, statusDocOf: ReadonlyMap<string, string>) {
  const primDoc = p.did ? docs[p.did] : null;
  const catDoc = meta.primitive_category_doc_id ? docs[meta.primitive_category_doc_id] : null;
  const catDocNo = catDoc?.doc_no ?? "";
  const lastSeg = catDocNo.split(".").pop() ?? "0";
  return {
    title: primDoc?.title ?? p.name,
    docId: p.did,
    st,
    category: catDoc?.title ?? null,
    categoryDocId: catDoc?.id ?? null,
    categoryOrder: Number.parseInt(lastSeg, 10) || 0,
    status: meta.status,
    statusDocId: p.did ? (statusDocOf.get(p.did) ?? null) : null,
    isUnknown: meta.is_unknown_primitive ?? false,
  };
}

const byCategoryThenDocNo = (docs: Docs) => (a: RadarPrimitive, b: RadarPrimitive): number => {
  if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder;
  const docA = a.docId ? docs[a.docId]?.doc_no ?? "" : "";
  const docB = b.docId ? docs[b.docId]?.doc_no ?? "" : "";
  return cmpDocNo(docA, docB);
};

/**
 * Primitives — one row per primitive declared under the agent, regardless of
 * whether it has instances. Instances (if any) are nested under each primitive.
 */
function agentPrimitives(graph: GraphData, docs: Docs, agentDocId: string, icds: Omit<Holdings, "primitives">): RadarPrimitive[] {
  const statusDocOf = buildStatusDocMap(graph.edges);
  const instancesBySt = groupBy(icds.instances, (inst) => inst.st);
  const invocationsBySt = groupBy(icds.invocations, (invo) => invo.st);
  const primitives: RadarPrimitive[] = [];
  for (const p of graph.primitives) {
    if (!p.m || !p.st) continue;
    const meta = parseMeta<PrimitiveMeta>(p.m);
    if (!meta || meta.agent_doc_id !== agentDocId) continue;
    primitives.push({
      ...primitiveFields(p, p.st, meta, docs, statusDocOf),
      instances: instancesBySt.get(p.st) ?? [],
      invocations: invocationsBySt.get(p.st) ?? [],
    });
  }
  return primitives.sort(byCategoryThenDocNo(docs));
}

/** What an agent holds: its instances, its invocations, and its primitives with both nested. Empty without a defining doc. */
export function buildActorHoldings(graph: GraphData, docs: Docs, definingDoc: AtlasNode | null): Holdings {
  if (!definingDoc) return { instances: [], invocations: [], primitives: [] };
  // ICD doc ID → primitive doc ID. Both instance_of (operational instances)
  // and invocation_of (in-progress invocations) resolve to the parent primitive.
  const instanceOfMap = buildInstanceOfMap(graph.edges);
  const instances = agentIcds(graph.instances, definingDoc.id, docs, instanceOfMap);
  const invocations = agentIcds(graph.invocations, definingDoc.id, docs, instanceOfMap);
  return { instances, invocations, primitives: agentPrimitives(graph, docs, definingDoc.id, { instances, invocations }) };
}
