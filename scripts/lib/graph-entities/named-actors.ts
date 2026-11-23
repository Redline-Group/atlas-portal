// Phase 1 steps 1f, 1g and 1l: actors a single registry or record doc names
// (Responsible Parties, ERG members, grant recipients).
import { ERG_MEMBERSHIP_UUID, ACTIVE_ECOSYSTEM_ACTORS_UUID, isGrantDoc } from "../graph-patterns.mjs";
import { extractRP, rpRoleAndName, isDescriptiveRP, extractListItems } from "../graph-content-extract.ts";
import { addNamedEntity, type EntityCtx } from "./context.ts";

// Role definition titles (e.g. "core council risk advisor"): the direct
// children of the Active Ecosystem Actors section (A.1.7.1).
function roleBindingTitles(ctx: EntityCtx): string[] {
  const aeaDoc = ctx.docById.get(ACTIVE_ECOSYSTEM_ACTORS_UUID);
  const roleDefs = aeaDoc ? (ctx.childrenByDocNo.get(aeaDoc.doc_no) ?? []) : [];
  return roleDefs.filter((d) => d.title).map((d) => d.title.toLowerCase());
}

// The entity name an RP declaration carries, or null when it carries none:
// a role alone ("Operational GovOps"), a descriptive phrase, or a name that
// is a role-binding doc's title (e.g. "Core Council Risk Advisor" →
// A.1.7.1.1.2), whose holder (e.g. BA Labs) Section 2s uses instead.
function namedResponsibleParty(content: string | undefined, roleTitles: string[]): string | null {
  const raw = extractRP(content);
  if (!raw) return null;
  const { name } = rpRoleAndName(raw);
  if (!name || isDescriptiveRP(name)) return null;
  const needle = name.toLowerCase();
  return roleTitles.some((t) => t.includes(needle)) ? null : name;
}

// --- 1f. Named Responsible Parties from Active Data Controllers (Pattern 6) ---
// Only creates ecosystem_actor entities when the RP declaration includes an
// explicit entity name. Role-only declarations carry no new entity — they are
// resolved to an existing role-edge target in Section 2s.
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

// A grant doc's "Recipient: <name>" line: starred bullet, dashed bullet, then bare.
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
