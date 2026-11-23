// Phase 1 step 1p: Agent Foundation and Development Company (dedicated
// legal-entity docs). Runs last, after every other entity source (accord
// parties, ERG, grants) has had first claim on a name. This step only fills a
// gap or corrects a type, never overwrites an existing entity's provenance.
// Every Agent artifact subtree (A.6.1.1.N.*) carries a "Foundation" doc
// ("<Name> is the Prime Foundation associated with <Agent>.") and usually a
// sibling "Development Company" doc ("<Name> is a|the ... company that
// provides services to <Foundation|Agent>."). The org-prose edge extractor
// (Phase 2w, prime_foundation_of / provides_services_to) reads these same
// sentences but only creates EDGES: it requires both named entities to
// already exist, and several agents' foundations and dev companies are named
// nowhere else (no accord party list, no ERG membership). Anchoring on the
// doc's own title (rather than scanning all content) keeps this precise.
import { slugify, PRIME_FOUNDATION_RE, PROVIDES_SERVICES_RE, cleanOrgProseName } from "../graph-patterns.mjs";
import { inAgentArtifact, patchEntityMeta, type Doc } from "../graph-records.ts";
import { addNamedEntity, type EntityCtx } from "./context.ts";

// Both title-anchored docs use ONE sentence each (Pattern 20's two shapes):
// a single `exec` per doc, not `matchAll`, since a second "Foundation"-shaped
// sentence later in the doc would not be this doc's own subject.
const LEGAL_ENTITY_DOCS = [
  { title: "Foundation", re: PRIME_FOUNDATION_RE, entityType: "foundation", source: "agent_foundation_doc" },
  { title: "Development Company", re: PROVIDES_SERVICES_RE, entityType: "development_company", source: "agent_dev_co_doc" },
];

// A dedicated legal-entity doc is the atlas's own canonical statement of
// what this entity is — more reliable than the "Foundation" name-suffix
// heuristic that classifies accord party members (1m), which mislabels a
// foundation branded without the word "Foundation" itself (e.g. Obex's
// "Rubicon", a development_company by that heuristic until corrected here).
// Correction is intentionally narrow: only an entity the accord heuristic
// could plausibly have produced (development_company or ecosystem_actor)
// gets retyped. Anything else — an agent, composite_party, delegate_org,
// etc. whose slug happens to collide with this doc's name — is left alone
// and warned about, since a silent retype there would be a real graph
// corruption, not a fix. The entity's original defining_doc_id/meta (e.g.
// the accord party doc that first named it) is left untouched; the
// correction is recorded alongside it, not over it.
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
