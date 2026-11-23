// Phase 1 steps 1h to 1j: delegate orgs, from address labels and from the
// Aligned and Ranked Delegate registry docs.
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
    // `addr` is an addressesRaw key (already normalized), but call it explicitly
    // so this doesn't lowercase case-sensitive Solana base58 into a split node id.
    pushTo(ctx.labelToAddresses, slug, { addr: normalizeAddress(addr), chain: info.chain ?? "ethereum" });
    if (!info.roles?.includes("delegate")) continue;
    ctx.addEntity(slug, info.label, "delegate_org", null, null, { source: "addresses_json_delegate", address: addr });
  }
}

// Prefer explicit list items, fall back to prose "Aligned Delegates are X, Y, Z."
function alignedDelegateNames(doc: Doc): string[] {
  const items = extractListItems(doc.content);
  if (items.length) return items;
  const m = doc.content?.match(ALIGNED_SENTENCE_RE);
  return m ? parseNameList(m[1]) : [];
}

// --- 1i. Aligned Delegates (Pattern 10) ---
// The doc is a registry table (parsed in build-graph Phase 2.7, which also
// emits aligned_delegate_for edges from the rows); the list and prose readers
// here are fallbacks for an atlas that states it as a plain list.
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
// Levels 1 and 2 have current-members docs; level 3 does not (verified in atlas).
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
