// Observation collection for the chain census (check-chains-census.ts).
//
// One observation = one raw chain string seen at one doc. The census keys them
// by the lowercased string, so the residue is per-chain-name, not per-mention.
import { findChainKeyedOddRows } from "../../lib/chain-candidates.ts";

export interface CensusDoc {
  id: string;
  doc_no: string;
  title?: string;
  content?: string;
}

export interface Observation {
  label: string;
  source: string;
  doc: CensusDoc;
}

/** One chain string's observations, grouped under its first-seen spelling. */
export interface LabelEntry {
  label: string;
  kind: string;
  chain: string;
  sources: Set<string>;
  docs: CensusDoc[];
  count: number;
}

type Observe = (raw: unknown, source: string, doc: CensusDoc) => void;

// -- Half 1: the explicit labels the real extractors read ---------------------

// build-graph.mjs icdParamChain: the `Token Address (X)` parenthetical. The
// ERC4626 marker is a vault-type flag, not a chain — icdParamChain skips it.
const TOKEN_ADDRESS_RE = /^Token Address \(([^)]+)\)/;
// build-graph.mjs icdParamChain reads `Network` and `Integration Partner Chain`.
// A bare `Chain` title is *not* read by the pipeline — it's included here as a
// forward-looking near-miss the atlas could plausibly adopt, so the census
// surfaces it early. Note the asymmetry: a `Chain` param naming a known chain
// still buckets `known` even though nothing consumes it.
const CHAIN_PARAM_TITLE_RE = /^(?:Network|Integration Partner Chain|Chain)$/i;
// graph-multisigs.mjs ADDRESS_CHAIN_RE, made global to sweep every doc.
const ADDRESS_CHAIN_RE = /\baddress of .+? on (?:the )?([A-Z][\w ]*?) is/g;

function observeLabels(doc: CensusDoc, observe: Observe): void {
  const title = doc.title ?? "";
  const content = doc.content ?? "";

  const tokenMatch = title.match(TOKEN_ADDRESS_RE);
  if (tokenMatch && !/ERC4626/i.test(tokenMatch[1]!)) {
    observe(tokenMatch[1], "token-address-param", doc);
  }

  if (CHAIN_PARAM_TITLE_RE.test(title)) {
    // Param docs hold a single value; take the first non-empty line, matching
    // how extractInstanceParams flattens a leaf.
    const value = content.trim().split("\n")[0]?.trim();
    // Prose-y `Integration Partner Chain` bodies ("The Aave Integration Boost
    // is on the Ethereum...") are sentences, not labels — the substring match
    // in classifyChainLabel still resolves them, so pass them through as-is.
    observe(value, "chain-param", doc);
  }

  for (const m of content.matchAll(ADDRESS_CHAIN_RE)) {
    observe(m[1], "multisig-prose", doc);
  }
}

// -- Half 2: inverted prose scan ---------------------------------------------
// Anchored on the chain word *trailing* the proper noun. The atlas's own noise
// runs the other way ("Chain Primitive", "Chainlog", "Chainlink"), so this
// anchor sidesteps it: `<Word> Chain` is nearly all real chain talk.
const PROSE_CHAIN_RE =
  /\b([A-Z][A-Za-z0-9-]{2,})\s+(?:Chain|Network|Mainnet|Rollup|L2|L1)\b/g;

function observeProse(doc: CensusDoc, observe: Observe): void {
  const haystack = `${doc.title ?? ""}\n${doc.content ?? ""}`;
  for (const m of haystack.matchAll(PROSE_CHAIN_RE)) {
    observe(m[1], "prose", doc);
  }
}

// -- Half 3: address-anchored scan -------------------------------------------
// Halves 1 and 2 both need the chain's name to appear in a shape they can
// recognize — a structured param, or a two-word `<Noun> Chain` phrase. A
// single-word chain name in a plain bullet row ("- Unichain - `0x…`") satisfies
// neither, which is exactly how unichain came to have three attributed
// addresses while this census reported it unseen. findChainKeyedOddRows closes
// that by reasoning about the list rather than the name: in an address list
// whose sibling rows name two or more distinct known chains, a row naming no
// known chain is a candidate chain — no advance knowledge of its name required.
function observeOddRows(doc: CensusDoc, observe: Observe): number {
  const rows = findChainKeyedOddRows(doc.content);
  for (const r of rows) observe(r.label, "address-list-row", doc);
  return rows.length;
}

/** Every observation, half by half over all docs, and the count of odd address-list rows. */
export function collectObservations(allDocs: CensusDoc[]): { observations: Observation[]; oddRowCount: number } {
  const observations: Observation[] = [];
  const observe: Observe = (raw, source, doc) => {
    const label = String(raw ?? "").trim();
    if (label) observations.push({ label, source, doc });
  };
  for (const doc of allDocs) observeLabels(doc, observe);
  for (const doc of allDocs) observeProse(doc, observe);
  let oddRowCount = 0;
  for (const doc of allDocs) oddRowCount += observeOddRows(doc, observe);
  return { observations, oddRowCount };
}
