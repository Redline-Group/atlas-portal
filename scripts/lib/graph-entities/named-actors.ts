import { ERG_MEMBERSHIP_UUID, ACTIVE_ECOSYSTEM_ACTORS_UUID, isGrantDoc } from "../graph-patterns.mjs";
import { extractRP, rpRoleAndName, isDescriptiveRP, extractListItems } from "../graph-content-extract.ts";
import { addNamedEntity, type EntityCtx } from "./context.ts";

function roleBindingTitles(ctx: EntityCtx): string[] {
  const aeaDoc = ctx.docById.get(ACTIVE_ECOSYSTEM_ACTORS_UUID);
  const roleDefs = aeaDoc ? (ctx.childrenByDocNo.get(aeaDoc.doc_no) ?? []) : [];
  return roleDefs.filter((d) => d.title).map((d) => d.title.toLowerCase());
}

// A name that is a role-binding title is not an entity: Section 2s resolves it to the holder.
function namedResponsibleParty(content: string | undefined, roleTitles: string[]): string | null {
  const raw = extractRP(content);
  if (!raw) return null;
  const { name } = rpRoleAndName(raw);
  if (!name || isDescriptiveRP(name)) return null;
  const needle = name.toLowerCase();
  return roleTitles.some((t) => t.includes(needle)) ? null : name;
}

// --- 1f. Named Responsible Parties from Active Data Controllers (Pattern 6) ---
export function addResponsibleParties(ctx: EntityCtx): void {
  const roleTitles = roleBindingTitles(ctx);
  for (const d of ctx.allDocs) {
    if (d.type !== "Active Data Controller") continue;
    const name = namedResponsibleParty(d.content, roleTitles);
    if (name) addNamedEntity(ctx, name, "ecosystem_actor", d, "active_data_controller");
  }
}

// --- 1g. ERG members (Pattern 7) ---
export function addErgMembers(ctx: EntityCtx): void {
  const ergDoc = ctx.docById.get(ERG_MEMBERSHIP_UUID);
  if (!ergDoc) {
    console.warn(`[graph] ERG membership doc (${ERG_MEMBERSHIP_UUID}) not found`);
    return;
  }
  ctx.ergDoc = ergDoc;
  ctx.ergMemberNames = extractListItems(ergDoc.content);
  for (const name of ctx.ergMemberNames) addNamedEntity(ctx, name, "ecosystem_actor", ergDoc, "erg_list");
}

const RECIPIENT_LINE_RES = [
  /\*\s*Recipient:\s*([^\n]+?)(?:\n|$)/i,
  /-\s*Recipient:\s*([^\n]+?)(?:\n|$)/i,
  /\bRecipient:\s*([^\n]+?)(?:\n|$)/i,
];

function grantRecipient(content: string | undefined): string | null {
  for (const re of RECIPIENT_LINE_RES) {
    const m = content?.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

// --- 1l. Grant recipients (foundations surface here) ---
export function addGrantRecipients(ctx: EntityCtx): void {
  for (const d of ctx.allDocs.filter(isGrantDoc)) {
    const name = grantRecipient(d.content);
    if (name === null) continue;
    const entityType = /\bFoundation\b/i.test(name) ? "foundation" : "ecosystem_actor";
    addNamedEntity(ctx, name, entityType, d, "grant_recipient");
  }
}
