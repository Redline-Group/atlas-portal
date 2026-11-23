// Phase 1 steps 1n and 1o: per-agent Primitive entities and the Instance or
// Invocation entities their Instance Configuration Documents define.
import { slugify, isICD, primitiveRootFor, ancestorByStripping } from "../graph-patterns.mjs";
import {
  primitiveSlugFromTitle,
  deriveInstanceName,
  classifyIcd,
  primitiveStatusFor,
  extractInstanceParams,
} from "../graph-instances.mjs";
import { agentArtifactDoc, type Doc } from "../graph-records.ts";
import type { EntityCtx } from "./context.ts";

// Two distinct ICDs can derive the same (agent, primitive, name) slug. Each ICD
// is its own entity keyed by icd.id, so a bare get-or-create on the shared slug
// would merge them: the first entity's id would move to the second ICD, the
// first's params would be orphaned, and its incoming edges (e.g. invoked_by)
// would dangle. A stable suffix from the ICD uuid keeps both instances.
function freeInstanceSlug(ctx: EntityCtx, slug: string, icd: Doc): string {
  if (!ctx.entityMap.has(slug)) return slug;
  let candidate = `${slug}-${icd.id.slice(0, 8)}`;
  while (ctx.entityMap.has(candidate)) candidate = `${candidate}-x`;
  return candidate;
}

// The doc one level above a primitive root: its primitive category.
const categoryDocId = (ctx: EntityCtx, primRoot: Doc): string | null =>
  ancestorByStripping(primRoot, 1, ctx.docByDocNo)?.id ?? null;

function addInstance(ctx: EntityCtx, icd: Doc, primRoot: Doc): void {
  const agentDoc = agentArtifactDoc(icd, ctx.docByDocNo);
  const { kind, status } = classifyIcd(icd, primRoot, ctx.docByDocNo);
  const params = extractInstanceParams(icd, ctx.childrenByDocNo);
  const primitiveSlug = primitiveSlugFromTitle(primRoot.title);
  const name = deriveInstanceName(icd, primRoot, agentDoc, params);
  const agentSlug = agentDoc ? slugify(agentDoc.title) : "unknown";
  const slug = freeInstanceSlug(ctx, `${agentSlug}-${primitiveSlug}-${slugify(name)}`, icd);
  // kind === null falls back to "instance" so out-of-scope ICDs still get a
  // graph entity (their status will be null). Per-atlas, the only valid kinds
  // are "instance" and "invocation".
  const entityType = kind === "invocation" ? "invocation" : "instance";
  ctx.addEntity(slug, name, entityType, primitiveSlug, icd.id, {
    agent_doc_id: agentDoc?.id ?? null,
    primitive_category_doc_id: categoryDocId(ctx, primRoot),
    is_unknown_primitive: !ctx.knownPrimitives.has(primRoot.title) || undefined,
    status,
    params,
  }).id = icd.id;
}

// --- 1n. Primitive Instance entities (Pattern: per-agent ICD → entity) ---
export function addPrimitiveInstances(ctx: EntityCtx): void {
  // fragile: doc_no prefix — the Prime Agent artifacts root (A.6.1.1)
  for (const icd of ctx.allDocs.filter((d) => isICD(d) && d.doc_no.startsWith("A.6.1.1."))) {
    const primRoot = primitiveRootFor(icd, ctx.docByDocNo);
    if (primRoot) addInstance(ctx, icd, primRoot);
  }
}

const PRIMITIVE_ROOT_RE = /^A\.6\.1\.1\.\d+\.2\.\d+\.\d+$/;

// --- 1o. Primitive entities (per-agent primitive root → entity) ---
// One entity per (agent, primitive) — emitted whether or not the primitive
// has instances. Status comes from the Primitive Hub Document's Global
// Activation Status leaf.
export function addPrimitives(ctx: EntityCtx): void {
  for (const primRoot of ctx.allDocs) {
    if (!PRIMITIVE_ROOT_RE.test(primRoot.doc_no) || !/Primitive$/i.test(primRoot.title)) continue;
    const agentDoc = agentArtifactDoc(primRoot, ctx.docByDocNo);
    if (!agentDoc) continue;
    const primitiveSlug = primitiveSlugFromTitle(primRoot.title);
    ctx.addEntity(`${slugify(agentDoc.title)}-${primitiveSlug}`, primRoot.title, "primitive", primitiveSlug, primRoot.id, {
      agent_doc_id: agentDoc.id,
      primitive_category_doc_id: categoryDocId(ctx, primRoot),
      status: primitiveStatusFor(primRoot, ctx.docByDocNo),
      is_unknown_primitive: !ctx.knownPrimitives.has(primRoot.title) || undefined,
    });
  }
}
