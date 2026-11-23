// The address hover card's Safe block: the live owners and threshold the
// balance sweep read (src/server/balances/safe-reads.ts), one entry per
// distinct setup across the chains the address sits on, and the atlas's stated
// threshold only where it disagrees with the chain.
import type { AddressInfo } from "@/types";
import type { AddressBalances, SafeState } from "@/lib/balances";
import type { MultisigFact } from "@/lib/addressGraphFacts";

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
  /** True when `chains` are not ones the atlas places the address on: it was
   *  never read on any of those, and this is the same address read elsewhere. */
  elsewhere: boolean;
}

type Balances = Record<string, AddressBalances>;

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

/** The address's Safe setups on `chains`, chains with the same setup merged. */
function setups(key: string, chains: readonly string[], balances: Balances, elsewhere: boolean): SafeView[] {
  const views: SafeView[] = [];
  for (const chain of chains) {
    const safe = balances[`${key}|${chain}`]?.safe;
    if (!safe) continue;
    const twin = views.find((v) => sameSetup(v, safe));
    if (twin) twin.chains.push(chain);
    else views.push({ ...safe, chains: [chain], atlas: null, elsewhere });
  }
  return views;
}

/** Every chain the balances hold a reading of the address on, in name order. */
function chainsRead(key: string, balances: Balances): string[] {
  const prefix = `${key}|`;
  return Object.keys(balances)
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length))
    .sort();
}

/**
 * The address's on-chain Safe setups; empty when it read as no Safe (or has
 * not been read). The sweep reads the chains the live atlas places an address
 * on, so a preview that moves a known address to another chain has no reading
 * there. Only when none of the atlas's chains was read at all does this fall
 * back to the same address read on other chains, flagged `elsewhere`; a chain
 * that was read and holds no Safe is an answer, not a gap.
 */
export function resolveSafes(address: string, addrMap: Record<string, AddressInfo>, balancesByAddress: Balances, atlas: readonly MultisigFact[]): SafeView[] {
  const key = address.toLowerCase();
  const info = addrMap[address] ?? addrMap[key];
  if (!info) return [];
  const placed = info.chains;
  const anyRead = placed.some((chain) => balancesByAddress[`${key}|${chain}`]);
  const views = anyRead ? setups(key, placed, balancesByAddress, false) : setups(key, chainsRead(key, balancesByAddress), balancesByAddress, true);
  return views.map((v) => ({ ...v, atlas: disagreement(v, atlas) }));
}
