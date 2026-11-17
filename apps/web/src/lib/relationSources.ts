import type { AtlasNode } from "@/types";

/** One Atlas document an extracted edge was read from; `id` is null when no loaded document has that number. */
export interface RelationSourceDoc {
  docNo: string;
  id: string | null;
}

/** Document ids by doc number. Built once per profile, and only when some edge names a source. */
export function docIdByDocNo(docs: Record<string, AtlasNode>): Map<string, string> {
  const out = new Map<string, string>();
  for (const d of Object.values(docs)) out.set(d.doc_no, d.id);
  return out;
}

/** An edge's source doc numbers as documents, in the order the edge lists them. */
export function relationSourceDocs(docNos: readonly string[] | undefined, idByDocNo: () => ReadonlyMap<string, string>): RelationSourceDoc[] {
  if (!docNos?.length) return [];
  const ids = idByDocNo();
  return docNos.map((docNo) => ({ docNo, id: ids.get(docNo) ?? null }));
}
