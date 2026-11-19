/**
 * ICD parameter value formatters and expanders: how one parameter leaf's prose
 * becomes displayable `[key, value]` pairs. Used by graph-instances.mjs's walk.
 */

import { RATE_LIMIT_ID_RE } from "../../src/lib/atlasHashes.ts";
import { expandPerToken } from "./rate-limit-per-token.ts";
import {
  ETH_ADDR_EXACT_RE,
  ETH_ADDR_FIRST_RE,
  SOL_ADDR_EXACT_RE,
} from "./address-chains.mjs";

// Atlas "directory" placeholder content is a convention — a doc whose content
// is just "The documents herein (define|contain|organize|govern)…" and whose
// real data lives in children. Those are NOT leaves.
export const DIRECTORY_RE =
  /^The documents? herein (define|contain|organize|govern|specify|describe|set|compose|hold)\b/i;

// Value formatters — normalize raw content into a displayable value. Keyed by
// leaf title. Each takes the raw trimmed content and returns a cleaned string.
// Fallback is backtick-unwrap + trim.
const unwrapBt = (s: string): string => s.match(/^`([^`\n]+)`\.?$/)?.[1] ?? s;
// Both patterns come from address-chains, the canonical home: the backtick
// branch tests the whole literal, and the fallback carries the hex-boundary
// lookarounds so a 64-hex transaction hash (the atlas writes those in the same
// backtick style) never yields its leading 40 hex as an "address".
// The formatter accepts 32–44 base58 chars separately:
// these isolated ICD values are passed through, not classified as canonical
// Solana addresses (whose shared pattern correctly remains 43–44 chars).
const LEGACY_ICD_BASE58_EXACT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const firstBtOrAddr = (s: string): string => {
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
  (prefixRe: RegExp, suffixRe: RegExp | null = null) =>
  (s: string): string => {
    let v = s.replace(prefixRe, "");
    if (suffixRe) v = v.replace(suffixRe, "");
    return v.replace(/\.$/, "").trim();
  };
// Extracts the 64-char hex hash from backticks, or preserves N/A variants. Any
// title naming a RateLimitID qualifies, unanchored on purpose ("Inflow
// RateLimitID", "Aggregate Deposit RateLimitID", "Rate Limit IDs"), since the
// hash sits in a sentence after it; RATE_LIMIT_ID_RE is atlasHashes.ts's rule.
const extractRateLimitId = (s: string): string => {
  const hash = s.match(/`(0x[0-9a-fA-F]{64})`/)?.[1];
  if (hash) return hash;
  const na = s.match(/:\s*(N\/A[^.]*)/i)?.[1]?.trim();
  return na ?? unwrapBt(s);
};

const PARAM_FORMATTERS: Record<string, (s: string) => string> = {
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
  Network: (s: string) => s.replace(/\.$/, "").trim(),
  "Target Protocol": (s: string) => s.replace(/\.$/, "").trim(),
  Token: (s: string) => s.replace(/\.$/, "").trim(),
  "Asset Supplied By Spark Liquidity Layer": (s: string) => s.replace(/\.$/, "").trim(),
};
export function formatParam(title: string, raw: string): string {
  const fn = PARAM_FORMATTERS[title];
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
const addressOnNetwork = (label: string) => (content: string): Array<[string, string]> | null => {
  const m = content.match(/on (?:the )?(.+?) is `(0x[0-9a-fA-F]+)`/i);
  return m ? [[`${label} / ${m[1].trim()}`, m[2]!]] : null;
};
export const PARAM_EXPANDERS: Record<string, (content: string) => Array<[string, string]> | null> = {
  "SubProxy Account": addressOnNetwork("SubProxy Account"),
  "StarGuard Contract": (content: string) =>
    /will be specified/i.test(content) ? [["StarGuard Contract", "TBD"]] : addressOnNetwork("StarGuard Contract")(content),
  "Genesis Account": (content: string) =>
    /will be specified/i.test(content) ? [["Genesis Account", "TBD"]] : addressOnNetwork("Genesis Account")(content),
  "Token Address": (content: string) => {
    // "The address of X on (the) CHAIN is `ADDR`." — repeats per chain.
    const re = /The address of \S+ on (?:the )?([^.]+?) is `([^`\n]+)`/gi;
    const out: Array<[string, string]> = [];
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
const BULLET_KV_RE = /^\s*[-*]\s+`([^`\n]+)`\s*:\s*(.+?)\s*$/gm;
export function expandBulletList(content: string, outerTitle: string): Array<[string, string]> | null {
  const out: Array<[string, string]> = [];
  const value = RATE_LIMIT_ID_RE.test(outerTitle) ? (v: string) => extractRateLimitId(v.trim()) : (v: string) => v.trim();
  for (const m of content.matchAll(BULLET_KV_RE)) out.push([`${outerTitle} / ${m[1].trim()}`, value(m[2])]);
  out.push(...expandPerToken(content, outerTitle));
  return out.length ? out : null;
}
