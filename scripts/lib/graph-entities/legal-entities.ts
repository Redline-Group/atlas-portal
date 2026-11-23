// Phase 2w only links these orgs; several are named nowhere else, so this step creates them.
import { slugify, PRIME_FOUNDATION_RE, PROVIDES_SERVICES_RE, cleanOrgProseName } from "../graph-patterns.mjs";
import { inAgentArtifact, patchEntityMeta, type Doc } from "../graph-records.ts";
import { addNamedEntity, type EntityCtx } from "./context.ts";

// One `exec` per doc, not `matchAll`: a later matching sentence is not this doc's subject.
const LEGAL_ENTITY_DOCS = [
  { title: "Foundation", re: PRIME_FOUNDATION_RE, entityType: "foundation", source: "agent_foundation_doc" },
  { title: "Development Company", re: PROVIDES_SERVICES_RE, entityType: "development_company", source: "agent_dev_co_doc" },
];

// Only types the accord name heuristic (1m) can mislabel get corrected; retyping anything else would corrupt the graph.
const RETYPABLE = new Set(["development_company", "ecosystem_actor"]);

function registerLegalEntity(ctx: EntityCtx, name: string, entityType: string, doc: Doc, source: string): void {
  const slug = slugify(name);
  const existing = ctx.entityMap.get(slug);
  if (!existing) return void addNamedEntity(ctx, name, entityType, doc, source);
  if (existing.entity_type === entityType) return;
  if (!RETYPABLE.has(existing.entity_type)) {
    console.warn(
      `  [drift] agent legal-entity doc (${doc.id}) names "${name}", but an existing ` +
        `${existing.entity_type} entity already holds that slug (${slug}) — not retyping it.`,
    );
    return;
  }
  existing.entity_type = entityType;
  patchEntityMeta(existing, { corrected_type_by: source, corrected_type_source_doc_no: doc.doc_no });
}

export function addAgentLegalEntities(ctx: EntityCtx): void {
  for (const d of ctx.allDocs) {
    const kind = inAgentArtifact(d) ? LEGAL_ENTITY_DOCS.find((k) => k.title === d.title) : undefined;
    if (!kind) continue;
    kind.re.lastIndex = 0;
    const m = kind.re.exec(d.content ?? "");
    if (!m) {
      console.warn(`  [drift] agent ${kind.title} doc (${d.doc_no}) found but its naming sentence did not parse`);
      continue;
    }
    registerLegalEntity(ctx, cleanOrgProseName(m[1]), kind.entityType, d, kind.source);
  }
}
