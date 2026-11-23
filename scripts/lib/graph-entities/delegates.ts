import { pushTo } from "../../../src/lib/collections.ts";
import { slugify, ALIGNED_DELEGATES_UUID, RANKED_DELEGATE_UUIDS } from "../graph-patterns.mjs";
import { parseNameList, extractListItems } from "../graph-content-extract.ts";
import { normalizeAddress } from "../address-chains.mjs";
import type { Doc } from "../graph-records.ts";
import { addNamedEntity, type EntityCtx } from "./context.ts";

const ALIGNED_SENTENCE_RE = /Aligned Delegates?\s+(?:are|is)\s+([^.]+)\./i;
const RANKED_SENTENCE_RE = /Ranked Delegates?\s+(?:are|is)\s+([^.]+)\./i;

// --- 1h. Delegates from addresses.json (labels; entity_type = delegate_org) ---
export function addAddressLabelDelegates(ctx: EntityCtx): void {
  for (const [addr, info] of Object.entries(ctx.addressesRaw)) {
    if (!info.label) continue;
    const slug = slugify(info.label);
    // Explicit normalize: lowercasing here would split case-sensitive Solana base58 ids.
    pushTo(ctx.labelToAddresses, slug, { addr: normalizeAddress(addr), chain: info.chain ?? "ethereum" });
    if (!info.roles?.includes("delegate")) continue;
    ctx.addEntity(slug, info.label, "delegate_org", null, null, { source: "addresses_json_delegate", address: addr });
  }
}

function alignedDelegateNames(doc: Doc): string[] {
  const items = extractListItems(doc.content);
  if (items.length) return items;
  const m = doc.content?.match(ALIGNED_SENTENCE_RE);
  return m ? parseNameList(m[1]) : [];
}

// --- 1i. Aligned Delegates (Pattern 10) ---
// The doc is a table (read in Phase 2.7); these readers are a fallback for a plain list.
export function addAlignedDelegates(ctx: EntityCtx): void {
  const doc = ctx.docById.get(ALIGNED_DELEGATES_UUID);
  if (!doc) {
    console.warn(`[graph] Aligned Delegates doc (${ALIGNED_DELEGATES_UUID}) not found`);
    return;
  }
  ctx.alignedDelegateNames = alignedDelegateNames(doc);
  for (const name of ctx.alignedDelegateNames) addNamedEntity(ctx, name, "delegate_org", doc, "aligned_delegates_list");
}

// --- 1j. Ranked Delegates (Pattern 10) ---
export function addRankedDelegates(ctx: EntityCtx): void {
  for (const [level, uuid] of RANKED_DELEGATE_UUIDS) {
    const d = ctx.docById.get(uuid);
    if (!d) {
      console.warn(`[graph] Level ${level} Ranked Delegates doc (${uuid}) not found`);
      continue;
    }
    const m = d.content?.match(RANKED_SENTENCE_RE);
    if (!m) continue;
    const names = parseNameList(m[1]);
    ctx.rankedDelegatesByLevel.set(level, names.map((name) => ({ name, docNo: d.doc_no })));
    for (const name of names) addNamedEntity(ctx, name, "delegate_org", d, "ranked_delegates_list");
  }
}
