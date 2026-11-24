import type { AtlasNode } from "@/types";
import type { AtlasBundle } from "@/lib/docsTypes";
import type { GraphData } from "./graph";
import { parseMeta } from "@/lib/meta";
import { parentDocNo, titleKeyer } from "./cousinTitles";

type Atlas = Pick<AtlasBundle, "docs" | "docNoToId">;

// Every primitive-category heading (Genesis Primitives, Operational Primitives,
// Demand Side Stablecoin Primitives, …), as the graph's entities record them.
const categoryCache = new WeakMap<GraphData, Set<string>>();
function categoryDocIds(graph: GraphData): Set<string> {
  let ids = categoryCache.get(graph);
  if (ids) return ids;
  ids = new Set();
  for (const e of [...graph.primitives, ...graph.instances, ...graph.invocations]) {
    const id = parseMeta<{ primitive_category_doc_id?: string | null }>(e.m)?.primitive_category_doc_id;
    if (id) ids.add(id);
  }
  categoryCache.set(graph, ids);
  return ids;
}

/** Title key of the primitive category `doc` sits in (or heads); "" outside every category. */
export function primitiveCategory(atlas: Atlas, graph: GraphData, doc: AtlasNode): string {
  const ids = categoryDocIds(graph);
  for (let no = doc.doc_no; no.includes("."); no = parentDocNo(no)) {
    const id = atlas.docNoToId.get(no);
    if (id && ids.has(id)) return titleKeyer(atlas.docs)(atlas.docs[id]?.title);
  }
  return "";
}

/** The hard rule over every cousin path: a cousin sits in the target's primitive category, or, like it, in none. */
export function inTargetCategory<T extends { node: AtlasNode }>(atlas: Atlas, graph: GraphData, target: AtlasNode, cousins: T[]): T[] {
  const category = primitiveCategory(atlas, graph, target);
  return cousins.filter((c) => primitiveCategory(atlas, graph, c.node) === category);
}
