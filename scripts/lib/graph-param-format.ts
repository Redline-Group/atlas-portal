/**
 * Value formatting and expansion for ICD / primitive param leaves: the half of
 * the param walk (graph-instances.mjs) that reads one document's own content.
 */

import { RATE_LIMIT_ID_RE } from "../../src/lib/atlasHashes.ts";
import { expandPerToken } from "./rate-limit-per-token.ts";
import { ETH_ADDR_EXACT_RE, ETH_ADDR_FIRST_RE, SOL_ADDR_EXACT_RE } from "./address-chains.mjs";

type Formatter = (s: string) => string;
type Pairs = [string, string][];
type Expander = (content: string) => Pairs | null;

// Atlas "directory" placeholder content is a convention — a doc whose content
// is just "The documents herein (define|contain|organize|govern)…" and whose
// real data lives in children. Those are NOT leaves.
export const DIRECTORY_RE =
  /^The documents? herein (define|contain|organize|govern|specify|describe|set|compose|hold)\b/i;

// Value formatters — normalize raw content into a displayable value. Keyed by
// leaf title. Each takes the raw trimmed content and returns a cleaned string.
// Fallback is backtick-unwrap + trim.
const unwrapBt: Formatter = (s) => s.match(/^`([^`\n]+)`\.?$/)?.[1] ?? s;
// Both patterns come from address-chains, the canonical home: the backtick
// branch tests the whole literal, and the fallback carries the hex-boundary
// lookarounds so a 64-hex transaction hash (the atlas writes those in the same
// backtick style) never yields its leading 40 hex as an "address".
// Preserve the formatter's historical 32–44 base58 acceptance separately:
// these isolated ICD values are passed through, not classified as canonical
// Solana addresses (whose shared pattern correctly remains 43–44 chars).
const LEGACY_ICD_BASE58_EXACT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const firstBtOrAddr: Formatter = (s) => {
  const bt = s.match(/`([^`\n]+)`/)?.[1];
  if (
    bt &&
    (ETH_ADDR_EXACT_RE.test(bt) ||
      SOL_ADDR_EXACT_RE.test(bt) ||
      LEGACY_ICD_BASE58_EXACT_RE.test(bt))
  ) return bt;
  return s.match(ETH_ADDR_FIRST_RE)?.[0] ?? s;
};
const stripSentence =
  (prefixRe: RegExp, suffixRe: RegExp | null = null): Formatter =>
  (s) => {
    let v = s.replace(prefixRe, "");
    if (suffixRe) v = v.replace(suffixRe, "");
    return v.replace(/\.$/, "").trim();
  };
// Extracts the 64-char hex hash from backticks, or preserves N/A variants. Any
// title naming a RateLimitID qualifies, unanchored on purpose ("Inflow
// RateLimitID", "Aggregate Deposit RateLimitID", "Rate Limit IDs"), since the
// hash sits in a sentence after it; RATE_LIMIT_ID_RE is atlasHashes.ts's rule.
const extractRateLimitId: Formatter = (s) => {
  const hash = s.match(/`(0x[0-9a-fA-F]{64})`/)?.[1];
  if (hash) return hash;
  const na = s.match(/:\s*(N\/A[^.]*)/i)?.[1]?.trim();
  return na ?? unwrapBt(s);
};

const PARAM_FORMATTERS: Record<string, Formatter> = {
  "Name": stripSentence(/^The name of [^.]*? is /i),
  "Agent Type": stripSentence(/^\S+ is an? /i),
  "Reward Code": unwrapBt,
  "Integration Partner Name": stripSentence(/^The partner for the [^.]*? is /i),
  "Integration Partner Reward Address": firstBtOrAddr,
  "Integration Partner Chain": stripSentence(/^The [^.]*? is on (the )?/i, /\s*blockchain\.?$/i),
  "Integration Boost Cadence": stripSentence(/^The payment cadence for the [^.]*? is /i),
  "Token Name": stripSentence(/^The name of [^.]*? is /i),
  "Token Symbol": stripSentence(/^The symbol of [^.]*? is /i),
  "Genesis Supply": stripSentence(/^The Genesis Supply of [^.]*? is /i),
  "Token Address": firstBtOrAddr,
  "Underlying Asset Address": firstBtOrAddr,
  "Allocator Role Address": firstBtOrAddr,
  "Pool Address": firstBtOrAddr,
  Address: firstBtOrAddr,
  Network: (s) => s.replace(/\.$/, "").trim(),
  "Target Protocol": (s) => s.replace(/\.$/, "").trim(),
  Token: (s) => s.replace(/\.$/, "").trim(),
  "Asset Supplied By Spark Liquidity Layer": (s) => s.replace(/\.$/, "").trim(),
};
export function formatParam(title: string, raw: string): string {
  // An address key's suffix names which one ("Underlying Asset Address (USDC)"), not another kind of value.
  const bare = PARAM_FORMATTERS[title.replace(/\s*\([^)]*\)$/, "")];
  const fn = PARAM_FORMATTERS[title] ?? (bare === firstBtOrAddr ? bare : undefined);
  if (fn) return fn(raw.trim());
  if (RATE_LIMIT_ID_RE.test(title)) return extractRateLimitId(raw.trim());
  return unwrapBt(raw.trim());
}

// Expanders turn a compound prose leaf into multiple keyed params sharing the
// same source doc. Used when a single leaf embeds per-chain or per-variant
// values (e.g. Agent Token's "Token Address" stuffs every deployed chain
// address into one blob). Returns Array<[key, value]> or null to fall through.
// "The address of X's SubProxy Account on (the) Network is `0xADDR`."
// → "SubProxy Account / Network": "0xADDR"
const addressOnNetwork = (label: string): Expander => (content) => {
  const m = content.match(/on (?:the )?(.+?) is `(0x[0-9a-fA-F]+)`/i);
  return m ? [[`${label} / ${m[1].trim()}`, m[2]]] : null;
};
const PARAM_EXPANDERS: Record<string, Expander> = {
  "SubProxy Account": addressOnNetwork("SubProxy Account"),
  "StarGuard Contract": (content) =>
    /will be specified/i.test(content) ? [["StarGuard Contract", "TBD"]] : addressOnNetwork("StarGuard Contract")(content),
  "Genesis Account": (content) =>
    /will be specified/i.test(content) ? [["Genesis Account", "TBD"]] : addressOnNetwork("Genesis Account")(content),
  "Token Address": (content) => {
    // "The address of X on (the) CHAIN is `ADDR`." — repeats per chain.
    const re = /The address of \S+ on (?:the )?([^.]+?) is `([^`\n]+)`/gi;
    const out: Pairs = [];
    for (const m of content.matchAll(re)) {
      const chain = m[1].trim().replace(/\s+blockchain$/i, "");
      out.push([`Token Address (${chain})`, m[2]]);
    }
    return out.length ? out : null;
  },
};

// Generic bullet-list expansion. Matches the atlas convention used for rate
// limits and similar parameter groupings:
//   "The {variant} are:\n\n- `key`: value\n- `key`: value"
// Keys are prefixed with the leaf title so sibling groups stay distinct
// ("Inflow Rate Limits / maxAmount" vs "Outflow Rate Limits / maxAmount").
// Under a RateLimitID title each value is a backticked hash and is unwrapped.
// A list that ticks some keys and not others ("- ALM Proxy: `0x…`" beside
// "- `RateLimits`: `0x…`") is still one list, so once a ticked key is found
// its plain-keyed siblings are read too; a list with no ticked key is prose.
const BULLET_KV_RE = /^\s*[-*]\s+`([^`\n]+)`\s*:\s*(.+?)\s*$/gm;
const BULLET_ANY_KV_RE = /^\s*[-*]\s+(?:`([^`\n]+)`|([^`:\n]+?))\s*:\s*(.+?)\s*$/gm;
function expandBulletList(content: string, outerTitle: string): Pairs | null {
  const out: Pairs = [];
  const value: Formatter = RATE_LIMIT_ID_RE.test(outerTitle) ? (v) => extractRateLimitId(v.trim()) : (v) => v.trim();
  const ticked = [...content.matchAll(BULLET_KV_RE)].length > 0;
  for (const m of ticked ? content.matchAll(BULLET_ANY_KV_RE) : []) {
    // A plain key whose value is itself ticked pairs is a per-token line, read below.
    if (m[2] && /^`[^`\n]+`\s*:/.test(m[3])) continue;
    out.push([`${outerTitle} / ${(m[1] ?? m[2]).trim()}`, value(m[3])]);
  }
  out.push(...expandPerToken(content, outerTitle));
  return out.length ? out : null;
}

/** A document's own content as keyed params: per-title expander, then the generic bullet list. */
export function expandParam(title: string, content: string): Pairs | null {
  return PARAM_EXPANDERS[title]?.(content) ?? expandBulletList(content, title);
}
