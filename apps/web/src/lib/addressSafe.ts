// The address hover card's Safe block: the live owners and threshold the
// balance sweep read (src/server/balances/safe-reads.ts), one entry per
// distinct setup across the chains the address is read on (readingChains),
// and the atlas's stated threshold only where it disagrees with the chain.
import type { AddressInfo } from "@/types";
import type { AddressBalances, SafeState } from "@/lib/balances";
import type { MultisigFact } from "@/lib/addressGraphFacts";
import { readingChains } from "./addressTooltip";

export interface AtlasDisagreement {
  name: string;
  required: number;
  total: number;
  docId: string | null;
}

export interface SafeView extends SafeState {
  /** Every chain the address reads as this same Safe setup on. */
  chains: string[];
  /** The atlas's threshold for this Safe, present only when it differs from the chain's. */
  atlas: AtlasDisagreement | null;
  /** True when `chains` are not ones the atlas places the address on (readingChains). */
  elsewhere: boolean;
}

// Safes return owners in their linked-list order, which differs across chains
// for the same owner set, so the set is compared, not the order.
const ownerSet = (s: SafeState): string => [...s.owners].sort().join();
const sameSetup = (a: SafeState, b: SafeState): boolean =>
  a.threshold === b.threshold && ownerSet(a) === ownerSet(b);

// An address the atlas names as several multisigs disagrees only when none of
// the thresholds it states for these chains matches the chain's.
function disagreement(view: SafeView, atlas: readonly MultisigFact[]): AtlasDisagreement | null {
  const stated = atlas.filter((f) => f.threshold && (f.chain == null || view.chains.includes(f.chain)));
  const agrees = (f: MultisigFact) => f.threshold?.required === view.threshold && f.threshold.total === view.owners.length;
  const first = stated[0];
  if (!first?.threshold || stated.some(agrees)) return null;
  return { name: first.name, required: first.threshold.required, total: first.threshold.total, docId: first.docId };
}

/** The address's on-chain Safe setups; empty when it read as no Safe (or has not been read). */
export function resolveSafes(
  address: string,
  addrMap: Record<string, AddressInfo>,
  balancesByAddress: Record<string, AddressBalances>,
  atlas: readonly MultisigFact[],
): SafeView[] {
  const key = address.toLowerCase();
  const { chains, elsewhere } = readingChains(address, addrMap, balancesByAddress);
  const views: SafeView[] = [];
  for (const chain of chains) {
    const safe = balancesByAddress[`${key}|${chain}`]?.safe;
    if (!safe) continue;
    const twin = views.find((v) => sameSetup(v, safe));
    if (twin) twin.chains.push(chain);
    else views.push({ ...safe, chains: [chain], atlas: null, elsewhere });
  }
  return views.map((v) => ({ ...v, atlas: disagreement(v, atlas) }));
}
