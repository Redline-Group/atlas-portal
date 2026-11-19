/**
 * doc_no navigation for pattern-driven graph extraction. Re-exported by
 * graph-patterns.mjs, the one entry point importers use.
 */

type DocLike = { doc_no: string; title: string };

export function ancestorByStripping(doc: DocLike, n: number, docByDocNo: Map<string, DocLike>) {
  const parts = doc.doc_no.split(".");
  if (parts.length <= n) return null;
  return docByDocNo.get(parts.slice(0, -n).join(".")) ?? null;
}

// The document an Annotation / Action Tenet / Scenario Variation annotates,
// from its doc_no alone. The spec fixes these suffixes (`.0.3.N`, `.0.4.N`,
// `.varN`) as structural, so stripping them is stable — unlike parentId, which
// the heading-depth cap flattens: 11 of 101 annotations sat under a capped
// ancestor rather than their target once artifact levels were restored to their
// true depth. Same reasoning as ancestorByStripping for `.0.6.N`.
export function annotationTarget(doc: DocLike, docByDocNo: Map<string, DocLike>) {
  const no = doc.doc_no.replace(/\.var\d+(\.\d+)?$/, "").replace(/\.0\.[34](\.\d+)?$/, "");
  return no !== doc.doc_no ? (docByDocNo.get(no) ?? null) : null;
}

// Resolve the Primitive root for any per-agent ICD. Primitive roots live at
// A.6.1.1.X.2.G.P (agent X → Sky Primitives section → primitive group G →
// primitive P). Every ICD lives under one of these, however deeply nested.
export function primitiveRootFor(doc: DocLike, docByDocNo: Map<string, DocLike>) {
  const m = doc.doc_no.match(/^(A\.6\.1\.1\.\d+\.2\.\d+\.\d+)(?:$|\.)/);
  if (!m) return null;
  const root = docByDocNo.get(m[1]);
  return root && /Primitive$/i.test(root.title) ? root : null;
}

