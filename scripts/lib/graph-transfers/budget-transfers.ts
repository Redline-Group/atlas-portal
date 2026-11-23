import { eventProse, resolveKnownSender, resolveParty, type TransferCtx } from "./context.ts";
import { addTransfer } from "./edges.ts";
import { GENESIS_TITLE_RE } from "./genesis.ts";

// No title gate: the amount/token core plus resolve-only endpoints keep non-monetary prose out.
const BUDGET_TRANSFER_RE =
  /\b(.+?)\s+has transferred\s+([\d,.]+(?:\s+(?:billion|million|thousand))?)\s+([A-Z]{2,10})\s+from\s+(?:the\s+)?([^.]+?)\s+to\s+([A-Z][\w-]*(?:\s+[A-Z][\w-]*)*)/;

// --- Shape E: executed budget transfers ---
export function extractBudgetTransfers(ctx: TransferCtx): void {
  for (const d of ctx.allDocs) {
    if (GENESIS_TITLE_RE.test(d.title)) continue; // Shape B owns these
    const m = eventProse(d)?.match(BUDGET_TRANSFER_RE);
    if (!m) continue;
    const from = resolveKnownSender(ctx, m[1].trim(), d);
    const to = resolveParty(ctx, m[5], d, { create: false });
    if (!from || !to || from.id === to.id) {
      ctx.warn(`budget transfer endpoints unresolved: ${d.doc_no} ("${d.title}")`);
      continue;
    }
    addTransfer(ctx, from, to, d, {
      kind: "budget_transfer",
      status: "completed",
      amounts: { [m[3]]: m[2] },
      source_budget: m[4].trim(),
    });
    ctx.stats.budgetTransfers++;
  }
}
