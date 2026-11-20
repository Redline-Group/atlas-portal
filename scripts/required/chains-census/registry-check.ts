// Registry completeness for the chain census — every entry in
// src/data/chain-registry.json must be whole. CHAINS / CHAIN_HINTS / EXPLORER /
// NATIVE_TOKEN all derive from the registry, so cross-file drift is
// structurally impossible and what remains to check is a registry entry with a
// hole in it. The derived maps (EXPLORER, NATIVE_TOKEN, CHAIN_HINTS) are still
// read through their real modules rather than from the JSON, so a broken
// derivation shows up here too.
import { CHAINS, FUTURE_TO_ETHEREUM, type ChainEntry } from "../../lib/chains.mjs";
import { CHAIN_HINTS } from "../../lib/address-chains.mjs";
import { EXPLORER } from "../../../src/lib/explorer.ts";
import { NATIVE_TOKEN } from "../../../src/lib/tokens.ts";

export type RegistryWarn = (msg: string) => void;

const REGISTRY = "the registry (src/data/chain-registry.json)";

/** A `[drift]` warner for registry defects, and the number of warnings it has printed. */
export function makeRegistryWarn(): { warn: RegistryWarn; count: () => number } {
  let registryDrift = 0;
  const warn = (msg: string) => {
    console.warn(`[drift] chains-census: ${msg}`);
    registryDrift++;
  };
  return { warn, count: () => registryDrift };
}

// Solana is the one intentional non-EVM entry: no chainId, no EVM rpcUrl,
// and no CHAIN_HINTS entry either — detectChain only ever runs on EVM
// (ETH_ADDR_RE) matches, and solana addresses are attributed by their base58
// shape (SOL_ADDR_RE) instead. Every EVM chain does need a hint.
const isEvmChain = (c: ChainEntry) => c.chain !== "solana";

function checkAddressing(c: ChainEntry, hintChains: Set<string>, warn: RegistryWarn): void {
  if (!EXPLORER[c.chain]) {
    warn(`chain "${c.chain}" has no explorer in ${REGISTRY} — its addresses would link to etherscan.io, another chain’s explorer.`);
  }
  const isEvm = isEvmChain(c);
  if (isEvm && !hintChains.has(c.chain)) {
    warn(`chain "${c.chain}" has no proseHints in ${REGISTRY} — detectChain can never attribute a prose address to it.`);
  }
  if (isEvm && c.chainId == null) warn(`chain "${c.chain}" has no chainId in ${REGISTRY}.`);
  if (isEvm && !c.rpcUrl) warn(`chain "${c.chain}" has no rpcUrl in ${REGISTRY} — it cannot be queried on-chain.`);
  if (!isEvm && c.rpcUrl) warn(`chain "${c.chain}" is non-EVM but declares an rpcUrl.`);
}

function checkDataSources(c: ChainEntry, warn: RegistryWarn): void {
  const isEvm = isEvmChain(c);
  // NATIVE_TOKEN is a hard gate in src/server/balances/fetch-balances.ts: a
  // chain missing from it is skipped as "unsupported" and reports no balances
  // at all — silently, like every other half-added-chain failure. Solana is the
  // deliberate omission (adding it would push Solana addresses through viem).
  if (isEvm && !NATIVE_TOKEN[c.chain]) {
    warn(`chain "${c.chain}" has no nativeToken in ${REGISTRY} — fetch-balances treats it as unsupported and returns no balances for it.`);
  }
  if (!isEvm && NATIVE_TOKEN[c.chain]) {
    warn(`chain "${c.chain}" is non-EVM but has a NATIVE_TOKEN entry — that would send its addresses through the EVM multicall path.`);
  }
  // A chain Etherscan v2 cannot serve has no contract-metadata source at all
  // unless Blockscout fills in (address-enrich's only other backend).
  if (c.etherscan === false && !c.blockscoutApi) {
    warn(`chain "${c.chain}" is flagged etherscan:false but declares no blockscoutApi — address-enrich has no contract-metadata source for it.`);
  }
}

// A derived map naming a chain the registry does not is not reachable from the
// data alone — it means the derivation itself broke, which is worth catching
// precisely because nothing else would notice.
function checkDerivations(chainKeys: Set<string>, hintChains: Set<string>, warn: RegistryWarn): void {
  const maps: [string, Record<string, unknown>][] = [["EXPLORER (src/lib/explorer.ts)", EXPLORER], ["NATIVE_TOKEN (src/lib/tokens.ts)", NATIVE_TOKEN]];
  for (const [label, map] of maps) {
    for (const key of Object.keys(map)) {
      if (!chainKeys.has(key)) warn(`${label} has "${key}" but the registry does not — the derivation is out of step with its source.`);
    }
  }
  for (const h of hintChains) {
    if (!chainKeys.has(h)) warn(`CHAIN_HINTS has "${h}" but the registry does not — the derivation is out of step with its source.`);
  }
  for (const f of FUTURE_TO_ETHEREUM) {
    if (chainKeys.has(f)) warn(`"${f}" is both a registered chain and listed under "deferred" — drop it from deferred now that it is fully supported.`);
  }
}

/** Warns on every incomplete registry entry and broken derivation; returns the registry's chain keys. */
export function checkRegistry(warn: RegistryWarn): Set<string> {
  const chainKeys = new Set(CHAINS.map((c) => c.chain));
  const hintChains = new Set(CHAIN_HINTS.map((h) => h.chain));
  for (const c of CHAINS) {
    checkAddressing(c, hintChains, warn);
    checkDataSources(c, warn);
  }
  checkDerivations(chainKeys, hintChains, warn);
  return chainKeys;
}
