// Etherscan v2 reads for enumerate-onchain-polls.ts: the createPoll txs of the
// poll-creation emitter, and the calldata decoder for them.
import process from "node:process";
import { Buffer } from "node:buffer";

export const API_KEY = process.env.ETHERSCAN_API_KEY;
const V2 = "https://api.etherscan.io/v2/api?chainid=1";
export const CREATE_EMITTER = "0xF9be8F0945acDdeeDaA64DFCA5Fe9629D0CF8E5D"; // createPoll(start,end,multiHash,url) txs
export const CREATE_POLL_SELECTOR = "0xd54a8176"; // createPoll(uint256,uint256,string,string)

export interface Tx {
  input?: string;
  timeStamp: string;
  hash: string;
  blockNumber: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Etherscan envelopes vary by action, so the body stays untyped.
async function getJson(url: string, tries = 4): Promise<any> {
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

// Decode createPoll(uint256 startDate, uint256 endDate, string multiHash, string url).
export function decodeCreatePoll(input: unknown) {
  if (typeof input !== "string") return null;
  const buf = Buffer.from(input.slice(input.startsWith("0x") ? 10 : 8), "hex"); // strip 0x + 4-byte selector
  if (buf.length < 5 * 32) return null;
  const uint = (i: number) => Number(BigInt("0x" + buf.subarray(i * 32, (i + 1) * 32).toString("hex")));
  const readStr = (off: number) => {
    if (!Number.isFinite(off) || off + 32 > buf.length) return null;
    const len = Number(BigInt("0x" + buf.subarray(off, off + 32).toString("hex")));
    if (len <= 0 || off + 32 + len > buf.length) return null;
    return buf.subarray(off + 32, off + 32 + len).toString("utf8");
  };
  return { start: uint(0), end: uint(1), multiHash: readStr(uint(2)), url: readStr(uint(3)) };
}

export type CreatePoll = NonNullable<ReturnType<typeof decodeCreatePoll>>;

export async function fetchCreatePollTxs(startBlock: number): Promise<Tx[]> {
  const out: Tx[] = [];
  for (let page = 1; page <= 25; page++) {
    const j = await getJson(
      `${V2}&module=account&action=txlist&address=${CREATE_EMITTER}&startblock=${startBlock}&endblock=99999999&sort=asc&page=${page}&offset=1000&apikey=${API_KEY}`,
    );
    const txs = Array.isArray(j.result) ? j.result : [];
    out.push(...txs);
    if (txs.length < 1000) break;
    await sleep(300);
  }
  return out;
}

/** The last block before `floorDate` (YYYY-MM-DD, UTC); bounds the scan. */
export async function floorBlock(floorDate: string): Promise<number> {
  const floorTs = Math.floor(Date.parse(`${floorDate}T00:00:00Z`) / 1000);
  const floor = await getJson(`${V2}&module=block&action=getblocknobytime&timestamp=${floorTs}&closest=before&apikey=${API_KEY}`);
  return Number(floor.result);
}
