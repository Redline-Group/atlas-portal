/**
 * ICD / primitive instance parameter extraction.
 */

import { DIRECTORY_RE, expandParam, formatParam } from "./graph-param-format.ts";

const CURRENT_PRIMITIVES_UUID = "203b8c79-c7cf-4fcc-94e3-5bf42f791619";

/**
 * Parse the "Current Primitives" doc content to build the authoritative set of
 * known primitive titles. Indented list items are primitives; top-level items
 * are category headings and are excluded from the set.
 */
export function buildKnownPrimitives(docById) {
  const doc = docById.get(CURRENT_PRIMITIVES_UUID);
  const known = new Set();
  if (!doc?.content) return known;
  for (const line of doc.content.split("\n")) {
    const m = line.match(/^(\s+)-\s+(.+)$/);
    if (m) known.add(m[2].trim());
  }
  return known;
}

/** Derive a stable slug from a primitive title by stripping the "Primitive" suffix. */
export function primitiveSlugFromTitle(title) {
  return title
    .replace(/\s+Primitive$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function primitiveDisplayName(title) {
  return title.replace(/\s+Primitive$/i, "").trim();
}

export function deriveInstanceName(icd, primRoot, agentDoc, params = {}) {
  const rawName = icd.title.replace(/\s+Instance Configuration Document\s*$/i, "").trim();
  const primitiveName = primitiveDisplayName(primRoot.title);
  const instanceOfMatch = rawName === "Single"
    ? primRoot.content?.match(/for (.+?)\.\s+See/i)
    : null;
  const baseName = instanceOfMatch
    ? instanceOfMatch[1].replace(/\binstance(?:s)?\b/g, "Instance")
    : rawName;

  const genericNames = new Set([
    "Single",
    primRoot.title,
    primitiveName,
  ]);
  const isGeneric =
    genericNames.has(baseName) ||
    baseName.toLowerCase() === primRoot.title.toLowerCase() ||
    baseName.toLowerCase() === primitiveName.toLowerCase();

  if (!isGeneric || !agentDoc?.title) return baseName;

  const partner = params["Integration Partner Name"]?.[0];
  return [agentDoc.title, primitiveName, partner].filter(Boolean).join(" — ");
}

/**
 * Read a primitive's Global Activation Status. Per the atlas convention,
 * `${primRoot}.1.1` is the Primitive Hub Document → Global Activation Status
 * leaf, whose content is a single backtick-wrapped token: `Active`, `Inactive`,
 * or `Completed`. Returns the literal token, or null if unreadable.
 */
export function primitiveStatusFor(primRoot, docByDocNo) {
  const statusDoc = docByDocNo.get(`${primRoot.doc_no}.1.1`);
  if (!statusDoc?.content) return null;
  const m = statusDoc.content.match(/`?(Active|Inactive|Completed)`?/i);
  if (!m) return null;
  return m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
}

// Classify an ICD as Instance (Active/Suspended/Completed) or Invocation
// (InProgress). Per atlas A.2.2.1.3 / A.2.2.1.4 these are distinct: an
// Invocation is the in-progress act of enabling a Primitive; an Instance is the
// resulting operational deployment. Tier docs sit at variable depth under
// primRoot (flat .2/.3 layouts vs nested .1.5.1.2 Suspended), so walk up the
// ancestor chain until we find a recognized title.
export function classifyIcd(icd, primRoot, docByDocNo) {
  let cur = icd;
  while (cur && cur.doc_no.startsWith(`${primRoot.doc_no}.`)) {
    const title = cur.title.toLowerCase();
    if (title.startsWith("active instances")) return { kind: "instance", status: "Active" };
    if (title.startsWith("completed instances")) return { kind: "instance", status: "Completed" };
    if (title.startsWith("suspended instances")) return { kind: "instance", status: "Suspended" };
    if (title.startsWith("in progress invocations")) return { kind: "invocation", status: "InProgress" };
    const lastDot = cur.doc_no.lastIndexOf(".");
    if (lastDot < 0) break;
    cur = docByDocNo.get(cur.doc_no.slice(0, lastDot));
  }
  return { kind: null, status: null };
}

// Index of direct children by parent doc_no (doc_no-based; parentId is unreliable past depth 6).
export function buildChildrenIndex(allDocs) {
  const childrenByDocNo = new Map();
  for (const d of allDocs) {
    const lastDot = d.doc_no.lastIndexOf(".");
    if (lastDot < 0) continue;
    const parentDocNo = d.doc_no.slice(0, lastDot);
    if (!childrenByDocNo.has(parentDocNo)) childrenByDocNo.set(parentDocNo, []);
    childrenByDocNo.get(parentDocNo).push(d);
  }
  return childrenByDocNo;
}


// A leaf's params under their own keys; a key already taken is prefixed with the leaf's parent title.
function addLeafParams(params, doc, pairs, parents) {
  for (const [key, value] of pairs) {
    const finalKey = key in params ? `${parents[parents.length - 1] ?? ""} / ${key}`.trim() : key;
    params[finalKey] = [value, doc.id, doc.doc_no];
  }
}

// Walk down from ANY param-container root and flatten leaves into
// { key: [formattedValue, srcUuid, srcDocNo] }. Handles both flat (DR/IB/
// agent-token) and nested (Allocation System: Parameters → Instance Identifiers
// → Network) variants. Key = leaf title. On title collision, prefix with
// "{parentTitle} / " to disambiguate.
//
// Root-agnostic on purpose: an ICD's canonical `Parameters` child is only one such
// container. `Instance-specific Operational Parameters` (23 ICDs) holds Contract
// Addresses / Risk Parameters blocks in exactly the same shape, and the embedding
// lane folds those too — so the walk lives here, pointed at a root, rather than
// being duplicated. Callers that want the canonical ICD behavior use
// extractInstanceParams below.
export function extractParamsFromRoot(rootDoc, childrenByDocNo) {
  if (!rootDoc) return {};
  const params = {};
  const pending = [{ doc: rootDoc, parents: [] }];
  while (pending.length) {
    const { doc, parents } = pending.shift();
    const kids = childrenByDocNo.get(doc.doc_no) ?? [];
    const content = (doc.content ?? "").trim();
    const stated = content && !DIRECTORY_RE.test(content);
    // Expansion order: per-title expander → generic bullet-list → formatter (leaves only).
    const expanded = stated ? expandParam(doc.title, content) : null;
    if (kids.length === 0) {
      if (stated) addLeafParams(params, doc, expanded ?? [[doc.title, formatParam(doc.title, content)]], parents);
    } else {
      // Skip the "Custom Instance Parameters" subtree at any depth — it's a
      // reserved extension slot, almost always empty/placeholder in practice.
      if (/^custom instance parameters$/i.test(doc.title)) continue;
      // A group with children still states its own values: `key`: value bullets
      // (a "Deposit Rate Limits" group with a "Deposit Rate Limit Default" child)
      // or an address sentence (a "StarGuard Contract" with a "StarGuard Max Delay" child).
      for (const [k, v] of expanded ?? []) params[k] ??= [v, doc.id, doc.doc_no];
      for (const c of kids) pending.push({ doc: c, parents: [...parents, doc.title] });
    }
  }
  return params;
}

// The canonical ICD case: params under the ICD's `Parameters` child. Unchanged
// contract — the graph build (graph-entities.mjs) and the eval query generator
// both depend on exactly this behavior.
export function extractInstanceParams(icd, childrenByDocNo) {
  const direct = childrenByDocNo.get(icd.doc_no) ?? [];
  return extractParamsFromRoot(
    direct.find((c) => c.title === "Parameters"),
    childrenByDocNo,
  );
}
