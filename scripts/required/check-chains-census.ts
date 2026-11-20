#!/usr/bin/env bun
/**
 * Chain coverage census — drift detector for the canonical chain registry
 * (src/data/chain-registry.json).
 *
 * The pipeline silently defaults every unrecognized chain to ethereum:
 * `normalizeChainLabel` collapses unknown labels, and `detectChain` is
 * keyword-driven so a chain nobody added to CHAIN_HINTS is invisible *by
 * construction*. Both failures are silent — an address on a new chain gets an
 * etherscan.io link and an ethereum chainId with no error anywhere. This census
 * is the alarm for that. (Robinhood Chain is the worked example: two `Network`
 * params named it while the registry had never heard of it.)
 *
 * Three independent halves:
 *
 *   labels     — the explicit chain strings the real extractors read:
 *                `Token Address (X)` titles, `Network` / `Integration Partner
 *                Chain` param docs, and the multisig `address of ... on X is`
 *                prose regex (plus a bare `Chain` title the pipeline does not
 *                yet consume — see CHAIN_PARAM_TITLE_RE). Each raw string goes
 *                through classifyChainLabel, so this measures close to exactly
 *                "a label the pipeline is about to collapse to ethereum".
 *   candidates — an inverted prose scan for `<Proper Noun> Chain|Network|
 *                Mainnet|Rollup|L2|L1`, minus the registry. Deliberately not a
 *                list of chain names someone thought of ahead of time: a drift
 *                detector built from known names cannot detect drift.
 *   odd rows   — chain-keyed address lists with a row naming no known chain
 *                (chain-candidates.ts). Both halves above still need the
 *                chain's name to appear in a shape they recognize, and a
 *                single-word name in a plain bullet row fits neither: unichain
 *                had three attributed addresses while this census called it
 *                unseen. This half reasons about the *list* instead of the
 *                name — see chain-candidates.ts for why that needs no advance
 *                knowledge of the missing chain.
 *
 * All three halves bucket into known / deferred (FUTURE_TO_ETHEREUM, an
 * intentional collapse) / unknown. Unknown is the residue — the watch list,
 * keyed by the chain string rather than per-doc, since the string is the unit
 * of drift. Atlas prose noise ("Pioneer Chain", "Partner Network") lands there
 * on the first --update and stays absorbed; that is the design working, not a
 * bug.
 *
 * Also asserts every registry entry is complete — explorer, proseHints,
 * chainId, rpcUrl, nativeToken, and the etherscan/blockscout pairing. Each hole
 * is its own silent failure: no explorer means etherscan.io links for another
 * chain's addresses, no proseHints means prose on that chain is never
 * attributed to it, no nativeToken means the balances fetcher skips it as
 * unsupported. CHAINS / CHAIN_HINTS / EXPLORER / NATIVE_TOKEN all derive from
 * the one registry, so those four cannot drift apart — but they are
 * still read through their real modules here, so a broken *derivation* is
 * caught too. An incomplete entry is a code bug, not atlas drift, so those
 * warnings are never baselined.
 *
 * Fix a missing chain with `pnpm chains:add <name>` rather than by hand.
 *
 * Runs under bun (not node) so it can import EXPLORER and NATIVE_TOKEN straight
 * from the TypeScript modules the frontend and balances fetcher use, rather
 * than re-deriving them from the registry and proving nothing.
 *
 * Warnings (stderr, picked up by atlas-update.yml's drift-issue step):
 *   - [drift] a chain string entered the residue that isn't in the committed
 *     baseline (.github/chains-census-baseline.json)
 *   - [drift] an incomplete registry entry or a broken derivation (never baselined)
 *
 * Always exits 0 — like the other censuses, it must never block a build.
 * `--update` rewrites the baseline (atlas-update.yml does this in the same
 * commit as the submodule bump).
 * `--rpc` additionally round-trips eth_chainId against every registry rpcUrl
 * and checks it matches the declared chainId. Opt-in: it needs network access,
 * so it is not part of the default (offline, deterministic) run.
 */

import fs from "node:fs";
import path from "node:path";
import { CHAINS, classifyChainLabel } from "../lib/chains.mjs";
import { naturalCompare } from "../lib/natural-sort.mjs";
import { makeWarn } from "../lib/graph-patterns.mjs";
import { collectObservations, type CensusDoc, type LabelEntry } from "./chains-census/observe.ts";
import { checkRegistry } from "./chains-census/registry-check.ts";
import { checkRpcEndpoints } from "./chains-census/rpc-check.ts";

const ROOT = path.resolve(import.meta.dir, "../..");
const BASELINE_PATH = path.join(ROOT, ".github/chains-census-baseline.json");
const [update, checkRpc] = ["--update", "--rpc"].map((f) => process.argv.includes(f));

const docsJson = JSON.parse(fs.readFileSync(path.join(ROOT, "public/docs.json"), "utf8"));
const allDocs = Object.values(docsJson.nodes as Record<string, CensusDoc>);

// The three halves of observation collection live in chains-census/observe.ts.
const { observations, oddRowCount } = collectObservations(allDocs);

// ---------------------------------------------------------------------------
// Bucket by classification, grouped on the chain string
// ---------------------------------------------------------------------------
const counts = { total: observations.length, known: 0, deferred: 0, unknown: 0, empty: 0 };
/** key = lowercased label */
const byLabel = new Map<string, LabelEntry>();

for (const obs of observations) {
  const c = classifyChainLabel(obs.label);
  counts[c.kind]++;
  if (c.kind === "empty") continue;

  const key = obs.label.toLowerCase();
  let entry = byLabel.get(key);
  if (!entry) {
    entry = { label: obs.label, kind: c.kind, chain: c.chain, sources: new Set(), docs: [], count: 0 };
    byLabel.set(key, entry);
  }
  entry.count++;
  entry.sources.add(obs.source);
  entry.docs.push(obs.doc);
}

const toRow = (entry: LabelEntry) => ({
  label: entry.label,
  sources: [...entry.sources].sort(),
  count: entry.count,
  // A couple of doc_no-sorted examples for human context. Recorded as UUIDs
  // (stable identity) with doc_no alongside for readability only.
  examples: [...entry.docs]
    .sort((a, b) => naturalCompare(a.doc_no, b.doc_no))
    .filter((d, i, xs) => xs.findIndex((x) => x.id === d.id) === i)
    .slice(0, 3)
    .map((d) => ({ uuid: d.id, doc_no: d.doc_no, title: d.title })),
});

const rows = [...byLabel.values()];
const residue = rows
  .filter((e) => e.kind === "unknown")
  .sort((a, b) => naturalCompare(a.label, b.label))
  .map(toRow);
const deferred = rows
  .filter((e) => e.kind === "deferred")
  .sort((a, b) => naturalCompare(a.label, b.label))
  .map(toRow);
const known = rows.filter((e) => e.kind === "known").sort((a, b) => naturalCompare(a.label, b.label));

// Registry completeness (chains-census/registry-check.ts). An incomplete
// entry is a code bug, not atlas drift, so these warnings are never baselined.
const registryStats = { warnings: 0 };
const registryWarn = makeWarn("[drift] chains-census:", registryStats);
const chainKeys = checkRegistry(registryWarn);

// ---------------------------------------------------------------------------
// Compare residue against baseline → [drift] warnings for new chain strings
// ---------------------------------------------------------------------------
let baselineLabels: Set<string> | null = null;
try {
  baselineLabels = new Set(
    JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")).residue.map((r: { label: string }) => r.label.toLowerCase()),
  );
} catch {
  console.warn("[chains-census] no baseline found — run with --update to create it");
}

let drift = 0;
if (baselineLabels) {
  for (const r of residue) {
    if (!baselineLabels.has(r.label.toLowerCase())) {
      const ex = r.examples[0];
      console.warn(
        `[drift] chains-census: NEW unrecognized chain string "${r.label}" ` +
          `(${r.count} mention(s), source: ${r.sources.join("+")}, e.g. ${ex?.doc_no} "${ex?.title}" ${ex?.uuid}). ` +
          `If it is a real chain, add it to CHAINS in scripts/lib/chains.mjs (chainId + rpcUrl) plus ` +
          `CHAIN_HINTS in scripts/lib/address-chains.mjs, EXPLORER in src/lib/explorer.ts, and ` +
          `NATIVE_TOKEN in src/lib/tokens.ts — the registry-consistency check below will name any ` +
          `you miss; if it is not yet live, add it to FUTURE_TO_ETHEREUM; otherwise --update the baseline.`,
      );
      drift++;
    }
  }
  const resolved = [...baselineLabels].filter(
    (l) => !residue.some((r) => r.label.toLowerCase() === l),
  ).length;
  if (resolved) console.log(`chains-census: ${resolved} baseline residue string(s) resolved (now recognized or gone)`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(
  `chains-census: ${counts.total} chain mention(s) — ${counts.known} known, ` +
    `${counts.deferred} deferred, ${counts.unknown} unknown, ${counts.empty} empty; ` +
    `${residue.length} residue string(s), ${drift + registryStats.warnings} drift warning(s)`,
);
// "Seen" means two different things, and conflating them was itself a bug: a
// chain can carry attributed addresses while never appearing in a label this
// census can parse. Reporting only the label view claimed unichain was unseen
// in a build that had just attributed three addresses to it — precisely the
// blind spot that let the misattribution stand. Read the attribution straight
// out of the artifact build-index wrote, so this reflects what the pipeline
// concluded rather than re-deriving it.
const attributed: Record<string, number> = {};
try {
  const atlasAddrs = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public/addresses.atlas.json"), "utf8"),
  ).addresses as Record<string, { chain?: string }>;
  for (const a of Object.values(atlasAddrs)) {
    if (a.chain) attributed[a.chain] = (attributed[a.chain] ?? 0) + 1;
  }
} catch {
  console.warn("[chains-census] no addresses.atlas.json — run pnpm build:index for the attribution view");
}

// Many labels can resolve to one chain ("Ethereum Mainnet", "Ethereum") — report
// the distinct set.
const labelChains = new Set(known.map((k) => k.chain));
const seenChains = [...new Set([...labelChains, ...Object.keys(attributed)])].sort();
console.log(`  registry: ${CHAINS.length} chains — ${seenChains.length} seen in this atlas build (${seenChains.join(", ")})`);
if (Object.keys(attributed).length) {
  const byCount = Object.entries(attributed).sort((a, b) => b[1] - a[1] || naturalCompare(a[0], b[0]));
  console.log(`  addresses attributed: ${byCount.map(([c, n]) => `${c} ${n}`).join(", ")}`);
}
const unseen = [...chainKeys].filter((k) => !seenChains.includes(k)).sort();
if (unseen.length) console.log(`  in registry but not seen in this atlas build: ${unseen.join(", ")}`);
console.log(
  `  address-list rows naming an unregistered chain: ${oddRowCount}` +
    (oddRowCount ? " — see the residue entries sourced address-list-row" : ""),
);
for (const d of deferred) {
  console.log(`  deferred → ethereum: "${d.label}" (${d.count} mention(s)) — promote to CHAINS when it goes live`);
}

if (checkRpc) await checkRpcEndpoints(registryWarn);

if (update) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({ residue }, null, 2) + "\n");
  console.log(`chains-census: baseline written → ${path.relative(ROOT, BASELINE_PATH)}`);
}
