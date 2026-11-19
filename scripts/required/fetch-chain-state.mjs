#!/usr/bin/env bun
/**
 * Calls no-arg view functions on every chainlog contract and returns the
 * snapshot — { block, values: { [addrLower]: { [fnName]: value | null } } }.
 *
 * Uses viem + multicall3 — ~44 contracts * ~80 functions batched into a
 * handful of RPC calls. The endpoint defaults to the ethereum entry of the
 * canonical registry in scripts/lib/chains.mjs (CHAIN_RPC), with ETH_RPC_URL
 * as an override for when the public endpoint rate-limits.
 *
 * The snapshot is NOT a file artifact any more (public/chain-state.json is
 * decommitted): the Railway atlas worker calls fetchChainState() on a time gate
 * and stores the result in Postgres (migration 020), and the frontend reads it
 * back from /api/chain-state. Running this script directly is the manual
 * escape hatch — one fetch, straight into the same table the worker writes:
 *
 *   pnpm snap:chainstate                       # fetch → upsert chain_state
 *   ETH_RPC_URL=https://… pnpm snap:chainstate
 *   BLOCK_NUMBER=25741379 pnpm snap:chainstate # pin the block (reproducibility)
 *
 * It is also how a DB-backed dev box gets a snapshot at all: the worker's step
 * is skipped in `--no-fetch` (local dev) mode, so nothing reaches for the RPC
 * behind your back.
 *
 * All numeric results are serialized as decimal strings to avoid JSON BigInt
 * issues. Address results are lowercased. The frontend renders them raw; a
 * formatting pass can interpret wad/ray/rad units later.
 */

import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { CHAIN_RPC } from "../lib/chains.mjs";
import { buildCalls, loadChainlogEntries } from "../lib/chain-state-calls.ts";

function serializeResult(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (Array.isArray(value)) return value.map(serializeResult);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serializeResult(v);
    return out;
  }
  return String(value);
}

/** Multicall every call in batches of 500 at one block; results line up with `calls`. */
async function multicallAll(client, calls, block, log) {
  const BATCH = 500;
  const rawResults = [];
  for (let i = 0; i < calls.length; i += BATCH) {
    const slice = calls.slice(i, i + BATCH);
    log(`  Batch ${Math.floor(i / BATCH) + 1}: ${slice.length} calls…`);
    const batch = await client.multicall({
      contracts: slice.map((c) => ({ address: c.address, abi: c.abi, functionName: c.fnName })),
      blockNumber: block,
      allowFailure: true,
    });
    rawResults.push(...batch);
  }
  return rawResults;
}

/** The pinned block (option, then BLOCK_NUMBER), else the latest. */
async function resolveBlock(client, opts, log) {
  const pinned = opts.blockNumber != null || Boolean(process.env.BLOCK_NUMBER);
  const block = opts.blockNumber != null
    ? BigInt(opts.blockNumber)
    : process.env.BLOCK_NUMBER
      ? BigInt(process.env.BLOCK_NUMBER)
      : await client.getBlockNumber();
  log(`Fetching at block ${block}${pinned ? " (pinned)" : " (latest)"}`);
  return block;
}

/** Serialize each call's result into values[address][fnName]; a reverted call is null. */
function collectValues(calls, rawResults, log) {
  const values = {};
  for (let i = 0; i < calls.length; i++) {
    const { address, fnName } = calls[i];
    const { status, result } = rawResults[i];
    if (!values[address]) values[address] = {};
    values[address][fnName] = status === "success" ? serializeResult(result) : null;
  }
  let successCount = 0; let failCount = 0;
  for (const fns of Object.values(values)) {
    for (const v of Object.values(fns)) { if (v !== null) successCount++; else failCount++; }
  }
  log(`Values: ${successCount} ok, ${failCount} reverted, across ${Object.keys(values).length} addresses`);
  return values;
}

/**
 * Fetch the whole snapshot. Throws rather than returning a thin/empty result —
 * an empty snapshot is indistinguishable from "the chain has no state" once
 * stored, and would replace a good row with nothing (see upsertChainState's
 * matching refusal).
 *
 * @param {{ rpcUrl?: string, blockNumber?: bigint|string|number, log?: (msg: string) => void }} [opts]
 * @returns {Promise<{ block: string, values: Record<string, Record<string, unknown>> }>}
 */
export async function fetchChainState(opts = {}) {
  const log = opts.log ?? console.log;
  const rpcUrl = opts.rpcUrl ?? process.env.ETH_RPC_URL?.trim() ?? CHAIN_RPC.ethereum;
  if (!rpcUrl) throw new Error("CHAIN_RPC.ethereum is missing from scripts/lib/chains.mjs");

  const client = createPublicClient({ chain: mainnet, transport: http(rpcUrl) });

  const chainlogEntries = await loadChainlogEntries(log, rpcUrl);
  const calls = await buildCalls(chainlogEntries, log);

  const block = await resolveBlock(client, opts, log);

  const rawResults = await multicallAll(client, calls, block, log);
  const values = collectValues(calls, rawResults, log);

  return { block: block.toString(), values };
}

// CLI: fetch once and upsert straight into Postgres — the same code path the
// atlas worker's time-gated step uses, minus the gate.
if (import.meta.main) {
  const { SQL } = await import("bun");
  const { upsertChainState } = await import("../../src/server/chain-state.ts");
  if (!process.env.DATABASE_URL) {
    console.error("snap:chainstate: DATABASE_URL is required (the snapshot is stored in Postgres, not public/chain-state.json)");
    process.exit(1);
  }
  const snapshot = await fetchChainState();
  const db = new SQL(process.env.DATABASE_URL);
  try {
    await upsertChainState(db, snapshot);
    console.log(`snap:chainstate: stored snapshot at block ${snapshot.block} (${Object.keys(snapshot.values).length} addresses)`);
  } finally {
    await db.close();
  }
}
