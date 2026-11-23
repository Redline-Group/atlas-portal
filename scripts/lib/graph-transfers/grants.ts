// Shapes A and C: grants. A grant doc records a disbursement (funds_transfer);
// a Grant Authorization doc in an accord authorizes payments without recording
// them (funds_authorization).
import { isGrantDoc, bulletField } from "../graph-patterns.mjs";
import { ETH_ADDR_SRC } from "../address-chains.mjs";
import type { Doc } from "../graph-records.ts";
import { eventProse, resolveParty, type TransferCtx } from "./context.ts";
import { addAuthorization, addTransfer } from "./edges.ts";

const AMOUNT_LINE_RE = bulletField(String.raw`(.+?)\s+amount`, String.raw`([\d,.]+)`, "gim");
const RECIPIENT_RE = bulletField("Recipient", String.raw`(.+?)`);
const RECIPIENT_ADDR_RE = bulletField("Recipient Address", `\`?(${ETH_ADDR_SRC})\`?`);
const TX_HASH_RE = bulletField("Transaction Hash", "`?(0x[0-9a-fA-F]{64})`?");

// "per month" and the "for a N month period" tail are both optional: a
// single-month or one-time grant drops the recurrence entirely ("a cash grant
// of 800,000 USDS to the Grove Foundation from Grove's Prime Treasury for July
// 2026", "a one-time cash grant of 700,000 USDS to the Skybase Foundation
// from Skybase's SubProxy"). Source can be a Treasury or a SubProxy.
const AUTH_GRANT_RE =
  /grant of\s+([\d,.]+)\s+([A-Z]{2,10})\s+(?:(per month)\s+)?to (?:the )?(.+?) from (.+?)(?:['’]s)? (?:Prime\s+)?(?:Treasury|SubProxy)\b(?:[\s\S]*?for a\s+\w+\s*\((\d+)\)\s*month period)?/i;
const AUTH_BEGIN_RE = /beginning on ([^.]+?)\./i;

// "- USDS amount: 50,000,000" lines, keyed by token.
function grantAmounts(content: string): Record<string, string> {
  const amounts: Record<string, string> = {};
  AMOUNT_LINE_RE.lastIndex = 0;
  for (const m of content.matchAll(AMOUNT_LINE_RE)) amounts[m[1].trim()] = m[2];
  return amounts;
}

function recordGrant(ctx: TransferCtx, d: Doc, content: string, recipientName: string): void {
  // A Recipient line always carries a name, and a named party resolves or is created.
  const recipient = resolveParty(ctx, recipientName, d)!;
  const amounts = grantAmounts(content);
  if (!Object.keys(amounts).length) ctx.warn(`grant doc without amounts: ${d.doc_no}`);
  addTransfer(ctx, ctx.skyCore, recipient, d, {
    kind: "grant",
    status: /disbursed/i.test(content) ? "disbursed" : "approved",
    period: d.title.replace(/\s*Grant\s*$/i, "").trim() || undefined,
    amounts,
    tx_hash: content.match(TX_HASH_RE)?.[1]?.toLowerCase(),
    recipient_address: content.match(RECIPIENT_ADDR_RE)?.[1]?.toLowerCase(),
  });
  ctx.stats.grants++;
}

// --- Shape A: A.2.13 grant docs ---
// Sender is Sky (treasury disbursement approved by governance) → sky-core.
export function extractGrants(ctx: TransferCtx): void {
  for (const d of ctx.allDocs.filter(isGrantDoc)) {
    const content = d.content ?? "";
    const recipientName = content.match(RECIPIENT_RE)?.[1];
    if (recipientName) recordGrant(ctx, d, content, recipientName);
    else ctx.warn(`grant doc without Recipient line: ${d.doc_no}`);
  }
}

function recordAuthorization(ctx: TransferCtx, d: Doc, content: string, m: RegExpMatchArray): void {
  const recipient = resolveParty(ctx, m[4], d);
  const sender = resolveParty(ctx, m[5], d);
  if (!recipient || !sender) return ctx.warn(`grant authorization endpoints unresolved: ${d.doc_no}`);
  const periodic = Boolean(m[3]);
  addAuthorization(ctx, sender, recipient, d, {
    periodic,
    amounts: { [periodic ? `${m[2]} per month` : m[2]]: m[1] },
    period_months: m[6] ? Number(m[6]) : undefined,
    // "Spark Foundation Grant Authorization: December 2025" → "December 2025"
    period: d.title.match(/Grant Authorization:?\s*(.+)$/i)?.[1]?.trim(),
    begin_date: content.match(AUTH_BEGIN_RE)?.[1]?.trim(),
  });
  ctx.stats.authorizations++;
}

// --- Shape C: grant authorizations in accords ---
export function extractGrantAuthorizations(ctx: TransferCtx): void {
  for (const d of ctx.allDocs) {
    if (!/grant authorization/i.test(d.title)) continue;
    const content = eventProse(d);
    if (content === null) continue;
    const m = content.match(AUTH_GRANT_RE);
    if (m) recordAuthorization(ctx, d, content, m);
    else ctx.warn(`grant authorization did not parse: ${d.doc_no} ("${d.title}")`);
  }
}
