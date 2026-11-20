// Opt-in live RPC verification for the chain census (--rpc): round-trips
// eth_chainId against every registry rpcUrl and checks it against the declared
// chainId. It needs network access, so the default census run never calls it.
import { CHAINS, type ChainEntry } from "../../lib/chains.mjs";
import type { RegistryWarn } from "./registry-check.ts";

interface Unreachable {
  chain: string;
  rpcUrl: string;
  message: string;
}

async function reportedChainId(rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
    signal: AbortSignal.timeout(15000),
  });
  return parseInt(((await res.json()) as { result: string }).result, 16);
}

async function probeAll(chains: ChainEntry[]) {
  const mismatched: string[] = [];
  const unreachable: Unreachable[] = [];
  let reached = 0;
  for (const c of chains) {
    if (!c.rpcUrl) continue;
    try {
      const got = await reportedChainId(c.rpcUrl);
      reached++;
      if (got === c.chainId) console.log(`  ok   ${c.chain} → ${got} (${c.rpcUrl})`);
      else mismatched.push(`rpcUrl for "${c.chain}" reports chainId ${got}, registry says ${c.chainId} — ${c.rpcUrl}`);
    } catch (err) {
      unreachable.push({ chain: c.chain, rpcUrl: c.rpcUrl, message: (err as Error).message });
    }
  }
  return { mismatched, unreachable, reached };
}

// Reaching *nothing* means the environment has no outbound path to these
// hosts — this census runs under bun, whose fetch ignores the HTTPS_PROXY that
// node's honours, so a proxied sandbox fails every chain including ethereum.
// Reporting that as a dozen broken endpoints sends the reader chasing
// phantoms, so it is said once and plainly instead.
function reportUnreachable(unreachable: Unreachable[], reached: number, warn: RegistryWarn): void {
  if (unreachable.length && reached === 0) {
    console.warn(
      `[chains-census] could not reach ANY of the ${unreachable.length} rpcUrl(s) — that is an environment ` +
        `limitation (no outbound access, or a proxy this runtime does not use), not a registry problem. ` +
        `No chainId was verified. First error: ${unreachable[0]!.message}`,
    );
    return;
  }
  for (const u of unreachable) {
    warn(`rpcUrl for "${u.chain}" is unreachable (${u.message}) — ${u.rpcUrl}`);
  }
}

export async function checkRpcEndpoints(warn: RegistryWarn): Promise<void> {
  console.log("chains-census: verifying rpcUrl endpoints (eth_chainId)…");
  const { mismatched, unreachable, reached } = await probeAll(CHAINS);
  // A wrong chainId is a real defect wherever it is observed, so it always warns.
  for (const m of mismatched) warn(m);
  // Unreachability is not.
  reportUnreachable(unreachable, reached, warn);
  console.log(`chains-census: ${reached} rpcUrl(s) reached, ${mismatched.length} mismatched, ${unreachable.length} unreachable`);
}
