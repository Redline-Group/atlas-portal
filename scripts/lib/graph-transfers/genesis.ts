// Shape B: genesis token distribution narratives (docs titled "Minting Of
// Tokens…" / "Transfer Of Tokens…" under agent artifacts).
import { normalizeKey } from "../graph-patterns.mjs";
import { agentArtifactDoc, type Doc, type Entity } from "../graph-records.ts";
import { eventProse, resolveKnownSender, resolveParty, trailingProperNoun, type TransferCtx } from "./context.ts";
import { addDataGap, addTransfer } from "./edges.ts";

export const GENESIS_TITLE_RE = /^(Minting|Transfer) Of Tokens/i;

// "X transferred 6.5 billion SPK tokens from … to the Y." / "X will transfer
// SPK tokens … to the Y." Amount group is optional (some planned transfers
// name no figure yet).
const GENESIS_TRANSFER_RE =
  /\b(.+?)\s+(transferred|will transfer)\s+(?:all of (?:the )?)?(?:([\d,.]+(?:\s+(?:billion|million|thousand))?)\s+)?([A-Z]{2,10})\s+tokens?\b[^.]*?\bto\s+(?:the\s+)?([^.,]+?)(?:,|\.|$)/i;
const GENESIS_TRANSFER_GAP_RE =
  /\b(.+?)\s+account\s+will transfer\s+([A-Z]{2,10})\s+tokens?\b[\s\S]*?\bfuture iteration\b/i;
const GENESIS_MINT_RE =
  /The Genesis Supply was minted to an account owned by\s+(?:the\s+)?(.+?)\./i;

// Mint event: the agent's token comes into existence in this account.
// Sender = the agent whose artifact this doc sits in.
function recordMint(ctx: TransferCtx, d: Doc, holderName: string): void {
  const agentDoc = agentArtifactDoc(d, ctx.docByDocNo);
  const agent = agentDoc ? ctx.nameIndex.get(normalizeKey(agentDoc.title)) : null;
  const holder = resolveParty(ctx, holderName, d);
  if (!agent || !holder) return ctx.warn(`genesis mint endpoints unresolved: ${d.doc_no}`);
  addTransfer(ctx, agent, holder, d, { kind: "genesis_mint", status: "completed" });
  ctx.stats.genesis++;
}

// A planned transfer that names its source but defers amount and recipient.
// Returns false when the doc does not read as one.
function recordGap(ctx: TransferCtx, d: Doc, content: string): boolean {
  const gap = content.match(GENESIS_TRANSFER_GAP_RE);
  const source = gap ? resolveParty(ctx, gap[1], d) : null;
  if (!gap || !source) return false;
  addDataGap(ctx, d, source, { kind: "planned_genesis_distribution_gap", status: "planned", token: gap[2] });
  ctx.stats.planned++;
  ctx.stats.dataGaps++;
  return true;
}

// Resolve-only first, so lead-in words never mint a junk entity; only the
// trailing proper noun (or, without one, the raw capture) is created.
function genesisSender(ctx: TransferCtx, fromRaw: string, d: Doc): Entity | null {
  return resolveKnownSender(ctx, fromRaw, d) ?? resolveParty(ctx, trailingProperNoun(fromRaw) || fromRaw, d);
}

// Past tense is a completed transfer; "will transfer" is a planned one.
function recordTransfer(ctx: TransferCtx, d: Doc, t: RegExpMatchArray): void {
  const from = genesisSender(ctx, t[1].trim(), d);
  const to = resolveParty(ctx, t[5], d);
  if (!from || !to || from.id === to.id) return ctx.warn(`genesis transfer endpoints unresolved: ${d.doc_no}`);
  const planned = t[2].toLowerCase() !== "transferred";
  if (planned) ctx.stats.planned++;
  addTransfer(ctx, from, to, d, {
    kind: "genesis",
    status: planned ? "planned" : "completed",
    amounts: t[3] ? { [t[4]]: t[3] } : {},
  });
  ctx.stats.genesis++;
}

function recordGenesisDoc(ctx: TransferCtx, d: Doc, content: string): void {
  const mint = content.match(GENESIS_MINT_RE);
  if (mint) return recordMint(ctx, d, mint[1]);
  const transfer = content.match(GENESIS_TRANSFER_RE);
  if (transfer) return recordTransfer(ctx, d, transfer);
  if (!recordGap(ctx, d, content)) ctx.warn(`genesis transfer did not parse: ${d.doc_no} ("${d.title}")`);
}

// --- Shape B: genesis token distribution narratives ---
export function extractGenesis(ctx: TransferCtx): void {
  for (const d of ctx.allDocs) {
    if (!GENESIS_TITLE_RE.test(d.title)) continue;
    const content = eventProse(d);
    if (content !== null) recordGenesisDoc(ctx, d, content);
  }
}
