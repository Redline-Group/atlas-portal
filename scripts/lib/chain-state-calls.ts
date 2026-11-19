// The call list for the chain-state snapshot: one zero-argument view call per
// function of each ethereum chainlog contract, from the cached Etherscan ABIs.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ADDRS_PATH = path.join(ROOT, "public/addresses.json");
const CACHE_DIR = path.join(ROOT, ".cache/etherscan");

type Log = (msg: string) => void;
type ChainlogInfo = { chainlogId?: string; isProxy?: boolean; implementation?: string };
export type ChainlogEntry = [string, ChainlogInfo];
export type ChainCall = { address: string; chainlogId?: string; fnName: string; abi: unknown[] };

async function loadAbi(addr: string): Promise<any[] | null> {
  try {
    const entry = JSON.parse(await fs.readFile(path.join(CACHE_DIR, "1", `${addr}.json`), "utf8"));
    if (!entry.abi) return null;
    return JSON.parse(entry.abi);
  } catch { return null; }
}

/** The ethereum chainlog entries of public/addresses.json; throws when there are none. */
export async function loadChainlogEntries(log: Log, rpcUrl: string): Promise<ChainlogEntry[]> {
  const addresses = JSON.parse(await fs.readFile(ADDRS_PATH, "utf8"));
  const chainlogEntries = Object.entries<any>(addresses).filter(
    ([, info]) => info.chainlogId && info.chain === "ethereum",
  );
  log(`Chainlog addresses: ${chainlogEntries.length}`);
  log(`RPC: ${rpcUrl}`);

  if (chainlogEntries.length === 0) {
    throw new Error(
      "No chainlog addresses in public/addresses.json — refusing to produce an empty " +
      "chain-state snapshot (likely a failed chainlog/address build upstream).",
    );
  }
  return chainlogEntries;
}

/** A proxy's implementation ABI when it is cached, else the contract's own. */
async function abiFor(addr: string, info: ChainlogInfo) {
  let abi: any[] | null = null;
  let upgraded = false;
  if (info.isProxy && info.implementation) {
    abi = await loadAbi(info.implementation);
    if (abi) { upgraded = true; }
    else { console.warn(`  ! proxy ${info.chainlogId}: no impl ABI for ${info.implementation}, falling back to proxy ABI`); }
  }
  if (!abi) { abi = await loadAbi(addr); }
  if (!abi) { console.warn(`  ! no ABI for ${info.chainlogId} (${addr})`); }
  return { abi, upgraded };
}

const viewFunctions = (abi: any[]) =>
  abi.filter(
    (fn) =>
      fn.type === "function" &&
      (fn.stateMutability === "view" || fn.stateMutability === "pure") &&
      (fn.inputs ?? []).length === 0,
  );

/** One call per zero-argument view/pure function of each contract, using the implementation ABI for proxies. */
export async function buildCalls(chainlogEntries: ChainlogEntry[], log: Log): Promise<ChainCall[]> {
  const calls: ChainCall[] = [];
  let proxyUpgraded = 0;
  for (const [addr, info] of chainlogEntries) {
    const { abi, upgraded } = await abiFor(addr, info);
    if (upgraded) proxyUpgraded++;
    if (!abi) continue;
    for (const fn of viewFunctions(abi)) { calls.push({ address: addr, chainlogId: info.chainlogId, fnName: fn.name, abi }); }
  }
  log(`Total calls: ${calls.length} across ${chainlogEntries.length} contracts (${proxyUpgraded} using impl ABI)`);

  if (calls.length === 0) {
    // The ABIs come from the read-through Etherscan cache in .cache/etherscan/1/,
    // which ships in the worker image (see .dockerignore's negation). An empty
    // call list means that cache is missing, not that the contracts have no
    // view functions — refuse instead of storing an empty snapshot.
    throw new Error(
      `No contract ABIs found in ${path.relative(ROOT, CACHE_DIR)}/1 — refusing to produce an ` +
      "empty chain-state snapshot (run `pnpm build:addresses` with ETHERSCAN_API_KEY to populate the cache).",
    );
  }
  return calls;
}
