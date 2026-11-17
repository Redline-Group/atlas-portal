import type { AtlasNode } from "@/types";

/** One Atlas document an extracted edge was read from; `id` is null when no loaded document has that number. */
export interface RelationSourceDoc {
  docNo: string;
  id: string | null;
}

/** Document ids by doc number. */
export function docIdByDocNo(docs: Record<string, AtlasNode>): Map<string, string> {
  return new Map(Object.values(docs).map((d) => [d.doc_no, d.id]));
}

/** An edge's source doc numbers as documents, in the order the edge lists them. */
export function relationSourceDocs(docNos: readonly string[] | undefined, idByDocNo: ReadonlyMap<string, string>): RelationSourceDoc[] {
  return (docNos ?? []).map((docNo) => ({ docNo, id: idByDocNo.get(docNo) ?? null }));
}
