#!/usr/bin/env bun
// Enumerate on-chain Atlas Edit governance polls — the severed-era recovery index.
//
// Sky/Maker ratify each Atlas Edit cycle with an on-chain governance poll. Poll
// CREATION is recorded by `createPoll(start, end, string multiHash, string url)` on
// the emitter 0xF9be… — each call carries the poll's IPFS `multiHash` + a
// `makerdao/community` GitHub raw URL to the poll markdown. These on-chain records
// are permanent and content-addressed, so they index the severed HTML era
// (2024-09 → 2025-05-28) that was garbage-collected from the next-gen-atlas repo. history-ok
// Vote tallies live separately as `Voted(voter, pollId, optionId)` on the
// PollingEmitter 0xD3A9FE…. See docs/plans/atlas-prehistory-mips.md (Tier 0) and
// forum-severed-era-history.md.
//
// This script ENUMERATES (date, multiHash, url, title); resolving each poll's
// markdown (→ edited atlas docs, Powerhouse UUIDs, forum link) is the
// reconstruction step's job. On-chain history is immutable, so re-runs are
// deterministic apart from the `captured` date.
//
// Not part of `pnpm build`. Needs an Etherscan key:
//   bun scripts/aux/atlas-history/enumerate-onchain-polls.ts
//   (or: ETHERSCAN_API_KEY=… bun scripts/aux/atlas-history/enumerate-onchain-polls.ts)

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  API_KEY,
  CREATE_EMITTER,
  CREATE_POLL_SELECTOR,
  decodeCreatePoll,
  fetchCreatePollTxs,
  floorBlock,
  type CreatePoll,
  type Tx,
} from "./onchain-polls-etherscan.ts";
import { classify, readRepoAeps, type RepoAep } from "./onchain-polls-aeps.ts";

const VOTE_EMITTER = "0xD3A9FE267852281a1e6307a1C37CDfD76d39b133"; // PollingEmitter; Voted(voter,pollId,optionId) tallies

const FLOOR_DATE = "2024-08-01"; // before the first Atlas Edit poll (2024-09-16); bounds the scan. history-ok
const TRUNCATION_DATE = "2025-05-28"; // next-gen-atlas repo re-init; git is authoritative on/after this
const ATLAS_RE = /atlas[\s_%]*edit/i;
const CID_RE = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]{20,})$/;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "atlas-onchain-polls.json"); // co-located with this script

const isoDate = (tsSeconds: string | number) => new Date(Number(tsSeconds) * 1000).toISOString().slice(0, 10);

interface AtlasEditPoll {
  dec: CreatePoll;
  url: string;
  multiHash: string;
}

/** The decoded call and its readable URL when the tx created an Atlas Edit poll, else null. */
function atlasEditPoll(t: Tx): AtlasEditPoll | null {
  const dec = decodeCreatePoll(t.input);
  if (!dec || !dec.url || !dec.multiHash) return null;
  let url = dec.url;
  try {
    url = decodeURIComponent(dec.url);
  } catch {
    /* keep raw */
  }
  if (!ATLAS_RE.test(url) && !ATLAS_RE.test(dec.url)) return null;
  return { dec, url, multiHash: dec.multiHash.trim() };
}

function pollRecord(t: Tx, { dec, url, multiHash }: AtlasEditPoll, aeps: Map<number, RepoAep>) {
  const title = (url.split("/").pop() || "").replace(/\.md$/i, "");
  const date = isoDate(t.timeStamp);
  const { kind, aep } = classify(title);
  const a = aep ? aeps.get(aep) : undefined;
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
    ...(a ? { repo_file: a.file, aep_poll_match: a.poll_slug ? multiHash.startsWith(a.poll_slug) : null } : {}),
  };
}

type PollRecord = ReturnType<typeof pollRecord>;

function buildManifest(polls: PollRecord[], scanned: number) {
  return {
    source: "ethereum mainnet (Etherscan v2)",
    captured: new Date().toISOString().slice(0, 10),
    create_emitter: CREATE_EMITTER,
    vote_emitter: VOTE_EMITTER,
    create_poll_selector: CREATE_POLL_SELECTOR,
    anchors: { floor_date: FLOOR_DATE, truncation_date: TRUNCATION_DATE },
    counts: {
      createpoll_txs_scanned: scanned,
      atlas_polls: polls.length,
      severed: polls.filter((p) => p.window === "severed").length,
      overlap: polls.filter((p) => p.window === "overlap").length,
      invalid_cid: polls.filter((p) => !p.valid_cid).length,
    },
    polls,
  };
}

function printSummary(manifest: ReturnType<typeof buildManifest>): void {
  console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
  console.log(manifest.counts);
  for (const p of manifest.polls) {
    console.log(`  ${p.date}  ${p.kind}${p.aep ? `(AEP-${p.aep})` : ""}  ${p.multiHash}  ${p.title}`);
  }
}

async function main() {
  if (!API_KEY) {
    console.error("ETHERSCAN_API_KEY not set — run: bun scripts/aux/atlas-history/enumerate-onchain-polls.ts");
    process.exit(1);
  }
  const txs = await fetchCreatePollTxs(await floorBlock(FLOOR_DATE));
  const createPolls = txs.filter((t) => (t.input || "").toLowerCase().startsWith(CREATE_POLL_SELECTOR));
  const aeps = new Map(readRepoAeps().map((a) => [a.aep, a]));

  const polls = createPolls.flatMap((t) => {
    const poll = atlasEditPoll(t);
    return poll ? [pollRecord(t, poll, aeps)] : [];
  });
  polls.sort((a, b) => a.date.localeCompare(b.date) || a.block - b.block);

  const manifest = buildManifest(polls, createPolls.length);
  fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
  printSummary(manifest);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
