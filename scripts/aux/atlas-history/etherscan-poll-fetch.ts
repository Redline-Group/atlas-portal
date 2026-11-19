// Etherscan v2 access for the Atlas Edit poll scan.

import { CREATE_EMITTER, type PollTx } from "./onchain-poll-record.ts";

export const V2 = "https://api.etherscan.io/v2/api?chainid=1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getJson(url: string, tries = 4): Promise<any> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.ok) {
        const j: any = await res.json();
        // Etherscan rate-limit: {status:"0", message:"NOTOK", result:"Max rate limit reached"}
        if (j.message === "NOTOK" && /rate limit/i.test(j.result || "")) {
          await sleep(1500 * (i + 1));
          continue;
        }
        return j;
      }
    } catch (err) {
      if (i === tries - 1) throw err;
    }
    await sleep(600 * (i + 1));
  }
  throw new Error(`fetch failed after ${tries} tries: ${url}`);
}

export async function fetchCreatePollTxs(startBlock: number, apiKey: string | undefined): Promise<PollTx[]> {
  const out: PollTx[] = [];
  for (let page = 1; page <= 25; page++) {
    const j = await getJson(
      `${V2}&module=account&action=txlist&address=${CREATE_EMITTER}&startblock=${startBlock}&endblock=99999999&sort=asc&page=${page}&offset=1000&apikey=${apiKey}`,
    );
    const txs = Array.isArray(j.result) ? j.result : [];
    out.push(...txs);
    if (txs.length < 1000) break;
    await sleep(300);
  }
  return out;
}
