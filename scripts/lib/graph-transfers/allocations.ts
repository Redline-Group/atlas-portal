import type { Doc } from "../graph-records.ts";
import { eventProse, resolveParty, type TransferCtx } from "./context.ts";
import { addTransfer } from "./edges.ts";

// Anchored at the end so mechanics docs like "Initial Allocation Distribution" don't gate in.
const ALLOCATION_TITLE_RE = /\b(?:Initial Allocation|Genesis Capital Allocation)$/i;
const ALLOCATION_RE =
  /\bThe (Initial Allocation|Genesis Capital Allocation) for (.+?) is ([\d,.]+)\s+([A-Z]{2,10})\./i;
const ALLOCATION_VOTE_RE = /included in the ([^.]+?Executive Vote)/i;

const ALLOCATION_DIRECT_RE = /(?:^|,\s*)([A-Z][A-Za-z ]+?)\s+shall directly transfer\b/;
const ALLOCATION_ITEM_RE =
  /\(\d+\)\s*([\d,.]+(?:\s+(?:billion|million|thousand))?)\s+([A-Z]{2,10})\s+to\s+(?:the\s+)?([^.,()]+?)(?=\s+and\s+\(|[.,(])/g;

function recordAllocation(ctx: TransferCtx, d: Doc, content: string, m: RegExpMatchArray): void {
  const recipient = resolveParty(ctx, m[2], d, { create: false });
  if (!recipient) return ctx.warn(`allocation recipient unresolved "${m[2]}": ${d.doc_no}`);
  const vote = content.match(ALLOCATION_VOTE_RE)?.[1]?.trim();
  addTransfer(ctx, ctx.skyCore, recipient, d, {
    kind: "allocation",
    allocation_type: /genesis/i.test(m[1]) ? "genesis_capital" : "initial",
    status: vote ? "planned" : "allocated",
    amounts: { [m[4]]: m[3] },
    ...(vote ? { scheduled: vote } : {}),
  });
  ctx.stats.allocations++;
}

function recordEnumeratedAllocations(ctx: TransferCtx, d: Doc, content: string): void {
  const direct = content.match(ALLOCATION_DIRECT_RE);
  const items = direct ? [...content.matchAll(ALLOCATION_ITEM_RE)] : [];
  if (!direct || !items.length) return ctx.warn(`allocation did not parse: ${d.doc_no} ("${d.title}")`);
  const sender = resolveParty(ctx, direct[1], d, { create: false }) ?? ctx.skyCore;
  for (const item of items) {
    const rawRecipient = item[3].trim();
    const recipient = resolveParty(ctx, rawRecipient, d, { create: false });
    if (!recipient) {
      ctx.warn(`allocation recipient unresolved "${rawRecipient}": ${d.doc_no}`);
      continue;
    }
    addTransfer(ctx, sender, recipient, d, {
      kind: "allocation",
      allocation_type: "genesis_capital",
      status: "planned",
      amounts: { [item[2]]: item[1] },
      ...(rawRecipient !== recipient.name ? { account: rawRecipient } : {}),
    });
    ctx.stats.allocations++;
  }
}

// --- Shape D: accord capital allocations ---
export function extractAllocations(ctx: TransferCtx): void {
  for (const d of ctx.allDocs) {
    if (!ALLOCATION_TITLE_RE.test(d.title)) continue;
    const content = eventProse(d);
    if (content === null) continue;
    const m = content.match(ALLOCATION_RE);
    if (m) recordAllocation(ctx, d, content, m);
    else recordEnumeratedAllocations(ctx, d, content);
  }
}
