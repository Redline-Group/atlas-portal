// 2v. mentions: doc → each address it contains, on the chain that doc places it:
// the chain the ICD states for an address its param doc holds, so the edge
// meets that instance's has_address at one node id; else the doc's own prose
// and headings (doc-address-chains.ts); else the address's primary chain. The
// primary alone put a doc that says "on Base is 0x…" on whichever chain another
// doc named first.
import { normalizeAddress } from "../address-chains.mjs";
import { docAddressChains, titleChainFor } from "../doc-address-chains.ts";
import { icdStatedChains } from "../graph-icd-params.ts";

function run(ctx) {
  const icd = icdStatedChains(ctx.entityMap.values());
  for (const d of ctx.allDocs) {
    if (!d.addressRefs?.length) continue;
    const placed = docAddressChains(d.content ?? "", titleChainFor(d, ctx.docByDocNo));
    for (const addr of d.addressRefs) {
      // addressRefs keep raw casing while addressesRaw is keyed by the normalized
      // form (EVM lowercased, Solana base58 as-is). The node id MUST match the
      // has_address side, or the graph splits around Solana addresses.
      const key = normalizeAddress(addr);
      const own = placed[key];
      const chain = icd.get(d.doc_no)?.get(key) ?? (own?.detected ? own.chain : null) ?? ctx.addressesRaw[key]?.chain ?? "ethereum";
      ctx.addEdge(d.id, "doc", `${key}:${chain}`, "address", "mentions", [d.doc_no]);
    }
  }
}

export const pattern = { id: "2v", run };
