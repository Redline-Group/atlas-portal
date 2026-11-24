// 2v. mentions: doc → each address it contains, on each chain the doc places it
// on. A param doc's address takes the chains the ICD gives its has_address nodes
// (icdStatedChains), so both edges meet at one node id. Any other takes the
// chains the doc places it on (docChains), which never puts a guess on a node
// no database row backs; a multisig's has_address takes the same from its
// address doc (graph-multisigs.mjs).
import { normalizeAddress } from "../address-chains.mjs";
import { docChains, docPlacements, titleChainFor } from "../doc-address-chains.ts";
import { icdStatedChains } from "../graph-icd-params.ts";

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
      for (const chain of stated ? [...stated] : docChains(placed[key], ctx.addressesRaw[key])) {
        ctx.addEdge(d.id, "doc", `${key}:${chain}`, "address", "mentions", [d.doc_no]);
      }
    }
  }
}

export const pattern = { id: "2v", run };
