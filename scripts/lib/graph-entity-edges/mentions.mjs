// 2v. mentions: doc → each address it contains, on each chain the doc places it
// on. A param doc's address takes the chains the ICD gives its has_address nodes
// (icdStatedChains), so both edges meet at one node id. Any other takes every
// chain the doc's prose or headings name (doc-address-chains.ts); a guess there
// (a heading, a nearby keyword) stands only on a chain the address is present
// on, when presence was read on chain (presentOnChains, which decides its
// database rows), so the edge is never on a node no row backs. With nothing
// left, the address's primary chain.
import { normalizeAddress } from "../address-chains.mjs";
import { docPlacements, titleChainFor } from "../doc-address-chains.ts";
import { icdStatedChains } from "../graph-icd-params.ts";

function placedChains(placed, raw) {
  const present = raw?.presentOnChains;
  const kept = (placed ?? []).filter((p) => p.stated || !present || present.includes(p.chain)).map((p) => p.chain);
  return kept.length ? kept : [raw?.chain ?? "ethereum"];
}

function run(ctx) {
  const icd = icdStatedChains(ctx.entityMap.values());
  for (const d of ctx.allDocs) {
    if (!d.addressRefs?.length) continue;
    const placed = docPlacements(d.content ?? "", titleChainFor(d, ctx.docByDocNo));
    for (const addr of d.addressRefs) {
      // addressRefs keep raw casing while addressesRaw is keyed by the normalized
      // form (EVM lowercased, Solana base58 as-is). The node id MUST match the
      // has_address side, or the graph splits around Solana addresses.
      const key = normalizeAddress(addr);
      const stated = icd.get(d.doc_no)?.get(key);
      for (const chain of stated ? [...stated] : placedChains(placed[key], ctx.addressesRaw[key])) {
        ctx.addEdge(d.id, "doc", `${key}:${chain}`, "address", "mentions", [d.doc_no]);
      }
    }
  }
}

export const pattern = { id: "2v", run };
