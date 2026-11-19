// Decoding of a createPoll transaction into an Atlas Edit poll record.

import { Buffer } from "node:buffer";

export const CREATE_EMITTER = "0xF9be8F0945acDdeeDaA64DFCA5Fe9629D0CF8E5D"; // createPoll(start,end,multiHash,url) txs
export const TRUNCATION_DATE = "2025-05-28"; // next-gen-atlas repo re-init; git is authoritative on/after this
const ATLAS_RE = /atlas[\s_%]*edit/i;
const CID_RE = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]{20,})$/;

export interface PollTx { input?: string; timeStamp: string; hash: string; blockNumber: string }
export interface RepoAep { aep: number; file: string; poll_slug: string | null }
interface DecodedPoll { start: number; end: number; multiHash: string | null; url: string | null }

// Decode createPoll(uint256 startDate, uint256 endDate, string multiHash, string url).
function decodeCreatePoll(input: unknown): DecodedPoll | null {
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

function classify(title: string) {
  const m = title.match(/\(AEP-(\d+)\)/i);
  if (m) return { kind: "monthly", aep: Number(m[1]) };
  if (/weekly/i.test(title)) return { kind: "weekly", aep: null };
  return { kind: "other", aep: null };
}

export const isoDate = (tsSeconds: string | number) => new Date(Number(tsSeconds) * 1000).toISOString().slice(0, 10);

function safeDecodeUri(url: string) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url; // keep raw
  }
}

function baseRecord(t: PollTx, dec: DecodedPoll, url: string, multiHash: string) {
  const title = (url.split("/").pop() || "").replace(/\.md$/i, "");
  const date = isoDate(t.timeStamp);
  const { kind, aep } = classify(title);
  return {
    date,
    window: date < TRUNCATION_DATE ? "severed" : "overlap",
    kind,
    aep,
    title,
    multiHash,
    valid_cid: CID_RE.test(multiHash),
    ipfs_url: `https://ipfs.io/ipfs/${multiHash}`,
    poll_url: url,
    start_date: isoDate(dec.start),
    end_date: isoDate(dec.end),
    tx: t.hash,
    block: Number(t.blockNumber),
    create_emitter: CREATE_EMITTER,
  } as Record<string, unknown> & { date: string; block: number; aep: number | null; multiHash: string };
}

// One createPoll tx -> poll record, or null when it is not an Atlas Edit poll.
export function pollRecord(t: PollTx, aeps: Map<number, RepoAep>) {
  const dec = decodeCreatePoll(t.input);
  if (!dec || !dec.url || !dec.multiHash) return null;
  const url = safeDecodeUri(dec.url);
  if (!ATLAS_RE.test(url) && !ATLAS_RE.test(dec.url)) return null;
  const rec = baseRecord(t, dec, url, dec.multiHash.trim());
  if (rec.aep && aeps.has(rec.aep)) {
    const a = aeps.get(rec.aep)!;
    rec.repo_file = a.file;
    rec.aep_poll_match = a.poll_slug ? rec.multiHash.startsWith(a.poll_slug) : null;
  }
  return rec;
}
