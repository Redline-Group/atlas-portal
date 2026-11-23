// Pure resolution logic for the address hover tooltip (src/components/AddressTooltip.tsx):
// an address's display name + its non-zero held balances and their USD value,
// from the shared address map, the balances cache and its prices.
import type { AddressInfo } from "@/types";
import type { BalanceMap, AddressBalances } from "@/lib/balances";
import { freshPrice, type PriceMap } from "@/lib/tokenPrices";
import { oldestTime } from "@/lib/provenance/asOf";
import { compactAmount, normalizeSymbol } from "@/lib/tokens";
import { hasResolvedName, resolveAddressName, resolveOwner } from "./addressName";
import { PRIMARY_BALANCE_SYMBOLS } from "@/lib/onchainAddressesIndex";
import { compactUsd, holdingUsd, holdingsTotal, isPegged } from "./addressValue";

export interface HeldBalance {
  symbol: string;
  amount: string;
  // Present only when the address holds balances on more than one chain —
  // see heldAcross below.
  chain?: string;
  // The holding's USD value (`$1.20K`), when a price is known for it.
  usd?: string;
}

interface RawHeld {
  symbol: string;
  raw: string;
  decimals: number;
  chain?: string;
}

function rank(symbol: string): number {
  const order = PRIMARY_BALANCE_SYMBOLS as readonly string[];
  const i = order.indexOf(symbol);
  return i === -1 ? order.length : i;
}

// Non-zero entries from a single chain's balance map, unsorted, unformatted.
function nonZero(balances: BalanceMap, chain?: string): RawHeld[] {
  return Object.entries(balances)
    .filter(([, b]) => {
      try {
        return BigInt(b.raw) > 0n;
      } catch {
        return false;
      }
    })
    .map(([symbol, b]) => ({ symbol, raw: b.raw, decimals: b.decimals, chain }));
}

// Primary symbols (ETH/USDS/SKY) first in that order, then alphabetical; ties
// on symbol (only possible once chain-tagged, i.e. multi-chain) break by chain.
function sortHeld(items: RawHeld[]): RawHeld[] {
  return [...items].sort(
    (a, b) =>
      rank(a.symbol) - rank(b.symbol) ||
      a.symbol.localeCompare(b.symbol) ||
      (a.chain ?? "").localeCompare(b.chain ?? ""),
  );
}

// Every non-zero holding across the chains the atlas places the address on (a
// Safe or deterministically-deployed contract can sit at the same address on
// several), tagged with its chain only when there are several.
function heldAcross(key: string, chains: string[], balancesByAddress: Record<string, AddressBalances>): RawHeld[] {
  const multiChain = chains.length > 1;
  return chains.flatMap((chain) => {
    const bal = balancesByAddress[`${key}|${chain}`];
    return bal ? nonZero(bal.balances, multiChain ? chain : undefined) : [];
  });
}

/**
 * A single compact "headline" balance for an address, for the inline pill: the
 * USD value of everything it holds (`$3.20K`, or `≈$3.20K+` when some holding has
 * no price), otherwise, below $1, the top-ranked unpegged holding as a token
 * amount (`35.4M SKY`). Null when the address holds nothing worth showing.
 * Full detail still lives in the tooltip; this is only the teaser.
 */
export function addressHeadlineBalance(
  address: string,
  addrMap: Record<string, AddressInfo>,
  balancesByAddress: Record<string, AddressBalances>,
  prices: PriceMap = {},
): string | null {
  const info = infoFor(address, addrMap);
  const chains = info?.chains ?? (info?.chain ? [info.chain] : []);
  const items = heldAcross(address.toLowerCase(), chains, balancesByAddress);
  const total = holdingsTotal(items, prices);
  if (total) return total;
  const others = items.filter((h) => !isPegged(h.symbol));
  if (others.length === 0) return null;
  const top = sortHeld(others)[0];
  // Floor dust at "<0.01": a pill is a teaser, so sub-cent amounts all read the
  // same rather than exposing "<0.0001"-style precision. Exact holdings still
  // live in the hover tooltip.
  const n = Number(top.raw) / 10 ** top.decimals;
  const amount = n <= 0.01 ? "<0.01" : compactAmount(top.raw, top.decimals);
  return `${amount} ${top.symbol}`;
}

// Exact case first: addressMap keys EVM addresses lowercased but leaves
// case-sensitive Solana base58 keys as-written (address-chains.mjs), so an
// exact match is always correct and a lowercased fallback is only needed to
// find a mixed-case EVM address (e.g. checksummed in markdown) — never for
// Solana, where lowercasing first risked resolving a different real pubkey.
// Mirrors the addrMap lookup in explorerUrl() (explorer.ts).
export const infoFor = (address: string, addrMap: Record<string, AddressInfo>): AddressInfo | undefined =>
  addrMap[address] ?? addrMap[address.toLowerCase()];

/**
 * The address's display name, and whether it is a real one: chainlogId or the
 * verified on-chain name only (the registryName the On-Chain Addresses report
 * shows), never the heuristic entityLabel (a best-effort proper-noun extraction
 * from surrounding prose — too often a stray phrase, not a real name).
 */
export function resolveAddressLabel(
  address: string,
  addrMap: Record<string, AddressInfo>,
): { name: string; named: boolean; owner: string | null } {
  const info = infoFor(address, addrMap);
  return { name: resolveAddressName(address, info), named: info ? hasResolvedName(info) : false, owner: resolveOwner(info) };
}

/**
 * The address's non-zero holdings across every chain the atlas places it on,
 * each with its USD value when priced, and their total (null below $1).
 */
export function resolveAddressHoldings(
  address: string,
  addrMap: Record<string, AddressInfo>,
  balancesByAddress: Record<string, AddressBalances>,
  prices: PriceMap = {},
): { held: HeldBalance[]; value: string | null } {
  const info = infoFor(address, addrMap);
  if (!info) return { held: [], value: null };
  // chains always contains at least info.chain — see AddressInfo's own comment.
  const raw = sortHeld(heldAcross(address.toLowerCase(), info.chains, balancesByAddress));
  const held = raw.map((h) => {
    const usd = holdingUsd(h, prices);
    return { symbol: h.symbol, amount: compactAmount(h.raw, h.decimals), chain: h.chain, usd: usd == null ? undefined : compactUsd(usd) };
  });
  return { held, value: holdingsTotal(raw, prices) };
}

/**
 * The chains whose readings stand for an address: the chains the atlas places
 * it on; or, when none of those was read at all, every chain the balances hold
 * a reading of the same address on, flagged `elsewhere`. The sweep reads the
 * chains the live atlas names, so a preview that moves a known address has no
 * reading where it now places it. A chain that was read is an answer, even
 * one that holds no Safe. Holdings stay on the atlas's own chains.
 */
export function readingChains(
  address: string,
  addrMap: Record<string, AddressInfo>,
  balancesByAddress: Record<string, AddressBalances>,
): { chains: string[]; elsewhere: boolean } {
  const info = infoFor(address, addrMap);
  const prefix = `${address.toLowerCase()}|`;
  if (!info || info.chains.some((chain) => balancesByAddress[prefix + chain])) return { chains: info?.chains ?? [], elsewhere: false };
  const read = Object.keys(balancesByAddress).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
  return { chains: read.sort(), elsewhere: read.length > 0 };
}

/**
 * When an address's chain values were read: the oldest balances reading across
 * its reading chains (its Safe setup comes from the same row), and the oldest
 * quote among the prices that value what it holds. Pegged holdings are valued
 * at $1 with no quote, so they add no price time.
 */
export function resolveAddressAsOf(
  address: string,
  addrMap: Record<string, AddressInfo>,
  balancesByAddress: Record<string, AddressBalances>,
  prices: PriceMap = {},
): { readAt: string | null; priceAt: string | null } {
  const info = infoFor(address, addrMap);
  if (!info) return { readAt: null, priceAt: null };
  const key = address.toLowerCase();
  const rows = readingChains(address, addrMap, balancesByAddress).chains.flatMap((chain) => balancesByAddress[`${key}|${chain}`] ?? []);
  const quoted = heldAcross(key, info.chains, balancesByAddress).filter((h) => freshPrice(h.symbol, prices) != null);
  return {
    readAt: oldestTime(rows.map((r) => r.checkedAt)),
    priceAt: oldestTime(quoted.map((h) => prices[normalizeSymbol(h.symbol)]?.asOf)),
  };
}
