// The on-chain addresses a preview brings in, for the reader's address hover
// card: named by a document the branch adds or changes, and by no document on
// its diff base. Given `live`, an address live main already names is not new
// either, the rule diff-artifacts.ts applies to documents. An address only a
// removed document named is on the base, so it is not new.
//
// Addresses are read with the build's own patterns (address-chains.mjs) and
// keyed as addresses.atlas.json keys them: EVM lowercased, base58 as written.
import { ETH_ADDR_RE, SOL_ADDR_RE, normalizeAddress } from "../../../scripts/lib/address-chains.mjs";
import type { Snapshot } from "./snapshot.ts";

function collect(content: string | undefined, into: Set<string>): void {
  if (!content) return;
  // matchAll copies the regex, so the shared /g patterns keep no lastIndex.
  for (const re of [ETH_ADDR_RE, SOL_ADDR_RE]) for (const m of content.matchAll(re)) into.add(normalizeAddress(m[0]));
}

/** Every address any document of the snapshot names. */
function namedBy(side: Snapshot): Set<string> {
  const out = new Set<string>();
  for (const doc of side.values()) collect(doc.content, out);
  return out;
}

/** The addresses `ids` (the head documents the diff lists as added or changed)
 *  name that neither `base` nor `live` does, sorted. */
export function introducedAddresses(ids: readonly string[], base: Snapshot, head: Snapshot, live?: Snapshot): string[] {
  const found = new Set<string>();
  for (const id of ids) collect(head.get(id)?.content, found);
  for (const side of live ? [base, live] : [base]) {
    if (found.size === 0) break;
    for (const addr of namedBy(side)) found.delete(addr);
  }
  return [...found].sort();
}
