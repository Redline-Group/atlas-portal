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

const isEvm = (addr: string): boolean => addr.startsWith("0x");

function addressesIn(content: string | undefined, patterns: readonly RegExp[]): string[] {
  if (!content) return [];
  // matchAll copies the regex, so the shared /g patterns keep no lastIndex.
  return patterns.flatMap((re) => Array.from(content.matchAll(re), (m) => normalizeAddress(m[0])));
}

// Only the patterns that can match a remaining candidate: an EVM address holds
// a 0, which base58 lacks, so neither pattern can match the other kind. The
// base58 scan is most of the cost of reading a whole snapshot.
function patternsFor(found: ReadonlySet<string>): RegExp[] {
  const all = [...found];
  return [...(all.some(isEvm) ? [ETH_ADDR_RE] : []), ...(all.some((a) => !isEvm(a)) ? [SOL_ADDR_RE] : [])];
}

/** `ids` are the head documents the diff lists as added or changed; sorted. */
export function introducedAddresses(ids: readonly string[], base: Snapshot, head: Snapshot, live?: Snapshot): string[] {
  const both = [ETH_ADDR_RE, SOL_ADDR_RE];
  const found = new Set(ids.flatMap((id) => addressesIn(head.get(id)?.content, both)));
  // A changed document that keeps its address rules it out without a full scan.
  for (const id of ids) for (const addr of addressesIn(base.get(id)?.content, both)) found.delete(addr);
  // Base and live are often the same snapshot, which needs reading once.
  for (const side of new Set(live ? [base, live] : [base])) {
    if (found.size === 0) break;
    const patterns = patternsFor(found);
    for (const doc of side.values()) for (const addr of addressesIn(doc.content, patterns)) found.delete(addr);
  }
  return [...found].sort();
}
