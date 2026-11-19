#!/usr/bin/env node
// Enumerate on-chain Atlas Edit governance polls — the severed-era recovery index.
//
// Sky/Maker ratify each Atlas Edit cycle with an on-chain governance poll. Poll
// CREATION is recorded by `createPoll(start, end, string multiHash, string url)` on
// the emitter 0xF9be… — each call carries the poll's IPFS `multiHash` + a
// `makerdao/community` GitHub raw URL to the poll markdown. These on-chain records
// are permanent and content-addressed, so they index the severed HTML era
// (2024-09 → 2025-05-28) that was garbage-collected from the next-gen-atlas repo.
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
//   bun scripts/aux/atlas-history/enumerate-onchain-polls.mjs
//   (or: ETHERSCAN_API_KEY=… bun scripts/aux/atlas-history/enumerate-onchain-polls.mjs)

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { fetchCreatePollTxs, getJson, V2 } from "./etherscan-poll-fetch.ts";
import { CREATE_EMITTER, pollRecord, TRUNCATION_DATE } from "./onchain-poll-record.ts";

const API_KEY = process.env.ETHERSCAN_API_KEY;
const VOTE_EMITTER = "0xD3A9FE267852281a1e6307a1C37CDfD76d39b133"; // PollingEmitter; Voted(voter,pollId,optionId) tallies
const CREATE_POLL_SELECTOR = "0xd54a8176"; // createPoll(uint256,uint256,string,string)
const FLOOR_DATE = "2024-08-01"; // before the first Atlas Edit poll (2024-09-16); bounds the scan

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "atlas-onchain-polls.json"); // co-located with this script
const AEP_DIR = path.resolve(__dirname, "../../../vendor/next-gen-atlas/Atlas Edit Proposals");

// Committed AEP files carry the ratification-poll URL (a vote.makerdao.com/polling/<slug>
// where <slug> is the IPFS multiHash prefix) — used to cross-link + integrity-check.
function readRepoAeps() {
  let files;
  try {
    files = fs.readdirSync(AEP_DIR).filter((f) => /^AEP-\d+\.md$/i.test(f));
  } catch {
    return [];
  }
  const field = (txt, name) => (txt.match(new RegExp(`^${name}\\s*:\\s*(.+)$`, "im")) || [])[1]?.trim() || null;
  return files.map((f) => {
    const txt = fs.readFileSync(path.join(AEP_DIR, f), "utf8");
    const pollUrl = field(txt, "Ratification Poll URL");
    return {
      aep: Number((f.match(/\d+/) || [])[0]),
      file: f,
      ratification_poll_url: pollUrl,
      poll_slug: (pollUrl && (pollUrl.match(/polling\/([A-Za-z0-9]+)/) || [])[1]) || null,
    };
  });
}

function buildManifest(createPolls, polls) {
  return {
    source: "ethereum mainnet (Etherscan v2)",
    captured: new Date().toISOString().slice(0, 10),
    create_emitter: CREATE_EMITTER,
    vote_emitter: VOTE_EMITTER,
    create_poll_selector: CREATE_POLL_SELECTOR,
    anchors: { floor_date: FLOOR_DATE, truncation_date: TRUNCATION_DATE },
    counts: {
      createpoll_txs_scanned: createPolls.length,
      atlas_polls: polls.length,
      severed: polls.filter((p) => p.window === "severed").length,
      overlap: polls.filter((p) => p.window === "overlap").length,
      invalid_cid: polls.filter((p) => !p.valid_cid).length,
    },
    polls,
  };
}

async function main() {
  if (!API_KEY) {
    console.error("ETHERSCAN_API_KEY not set — run: bun scripts/aux/atlas-history/enumerate-onchain-polls.mjs");
    process.exit(1);
  }
  const floorTs = Math.floor(Date.parse(`${FLOOR_DATE}T00:00:00Z`) / 1000);
  const floor = await getJson(`${V2}&module=block&action=getblocknobytime&timestamp=${floorTs}&closest=before&apikey=${API_KEY}`);
  const startBlock = Number(floor.result);

  const txs = await fetchCreatePollTxs(startBlock, API_KEY);
  const createPolls = txs.filter((t) => (t.input || "").toLowerCase().startsWith(CREATE_POLL_SELECTOR));

  const aeps = new Map(readRepoAeps().map((a) => [a.aep, a]));
  const polls = createPolls.map((t) => pollRecord(t, aeps)).filter(Boolean);
  polls.sort((a, b) => a.date.localeCompare(b.date) || a.block - b.block);

  const manifest = buildManifest(createPolls, polls);
  fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
  console.log(manifest.counts);
  for (const p of polls) {
    console.log(`  ${p.date}  ${p.kind}${p.aep ? `(AEP-${p.aep})` : ""}  ${p.multiHash}  ${p.title}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
