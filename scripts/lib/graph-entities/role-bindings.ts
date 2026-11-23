import { ACTIVE_ECOSYSTEM_ACTORS_UUID, CCRA_BINDING_UUID, SPELL_TEAM_UUID } from "../graph-patterns.mjs";
import { parseNameList } from "../graph-content-extract.ts";
import type { Doc } from "../graph-records.ts";
import { addNamedEntity, type EntityCtx } from "./context.ts";

const HELD_BY_RE = /role is held by\s+([^.]+)\./i;
const DESIGNATED_HELD_BY_RE = /\bThe\s+(.{2,60}?)\s+role is held by\s+([^.\n]+)\./i;
const UNNAMED_HOLDER_RE = /^(?:the|a|an|any|another|one|such|that|this|it)\b/i;
const SPELL_TEAMS_RE = /teams? of technical contributors for Spell development,?\s+(.+?)\.(?:\s|$)/i;

const roleSlugOf = (role: string): string => role.toLowerCase().replace(/\s+/g, "_");

function bindRole(ctx: EntityCtx, holderName: string, bindingDoc: Doc, roleSlug: string, source: string): void {
  const holder = addNamedEntity(ctx, holderName, "ecosystem_actor", bindingDoc, source);
  ctx.roleBindings.push({ holder, bindingDoc, roleSlug });
}

// --- 1k. Role bindings: walk A.1.7.1 children for .X.2 binding docs (Pattern 11) ---
export function addActorRoleBindings(ctx: EntityCtx): void {
  const aeaDoc = ctx.docById.get(ACTIVE_ECOSYSTEM_ACTORS_UUID);
  if (!aeaDoc) return;
  let foundCcra = false;
  for (const roleDef of ctx.childrenByDocNo.get(aeaDoc.doc_no) ?? []) {
    const bindingDoc = ctx.docByDocNo.get(roleDef.doc_no + ".2");
    const m = bindingDoc?.content?.match(HELD_BY_RE);
    if (!bindingDoc || !m) continue;
    if (bindingDoc.id === CCRA_BINDING_UUID) foundCcra = true;
    bindRole(ctx, m[1].trim(), bindingDoc, roleSlugOf(roleDef.title), "role_binding");
  }
  if (!foundCcra)
    console.warn(`[graph] Expected CCRA binding (${CCRA_BINDING_UUID}) not found — A.1.7.1 may have restructured`);
}

// --- 1k1. Role bindings outside the Active Ecosystem Actors walk ---
// The "Designated" title gate keeps prose hypotheticals out.
export function addDesignatedRoleBindings(ctx: EntityCtx): void {
  const seenBindingDocs = new Set(ctx.roleBindings.map((b) => b.bindingDoc.id));
  for (const d of ctx.allDocs) {
    if (seenBindingDocs.has(d.id) || !/\bdesignated\b/i.test(d.title)) continue;
    const m = d.content?.match(DESIGNATED_HELD_BY_RE);
    if (!m) continue;
    const name = m[2].trim();
    if (UNNAMED_HOLDER_RE.test(name)) continue;
    bindRole(ctx, name, d, roleSlugOf(m[1].trim()), "role_binding");
  }
}

// --- 1k2. Spell Team members (Spell Team Configuration doc) ---
export function addSpellTeams(ctx: EntityCtx): void {
  const doc = ctx.docById.get(SPELL_TEAM_UUID);
  if (!doc) return console.warn(`[graph] Spell Team doc (${SPELL_TEAM_UUID}) not found`);
  const m = doc.content?.match(SPELL_TEAMS_RE);
  if (!m) return console.warn(`[graph] Spell Team doc (${SPELL_TEAM_UUID}) found but member sentence did not parse`);
  for (const name of parseNameList(m[1])) bindRole(ctx, name, doc, "spell_team_member", "spell_team");
}
