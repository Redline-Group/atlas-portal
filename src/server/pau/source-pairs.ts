// Address pairs a Solidity source passes together in one argument list, with its
// named address constants resolved (`Ethereum.USDC`, or a bare `USDC` when only
// one constant has that name). A spell computes each rate-limit key in such a
// call (`makeAssetDestinationKey(LIMIT_ASSET_TRANSFER, Ethereum.USDC, DESTINATION)`),
// so these are the pairs its two-address keys can take (key-context.ts).
const CONST_RE = /\b(\w+)\s*=\s*(0x[0-9a-fA-F]{40})(?![0-9a-fA-F])/g;
const OWNER_RE = /\b(?:library|contract|interface)\s+(\w+)/g;
const TOKEN_RE = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])|\b(?:(\w+)\.)?(\w+)\b/g;
// A longer group is a body or a registry, not one call's arguments.
const MAX_LIST_CHARS = 2000;
const MAX_LIST_ADDRESSES = 8;

interface Symbols {
  qualified: Map<string, string>;
  bare: Map<string, string | null>;
}

/** Each address constant by `Owner.NAME`, and by bare name when the name is unique. */
function symbolsOf(source: string): Symbols {
  const owners = [...source.matchAll(OWNER_RE)].map((m) => ({ at: m.index, name: m[1] }));
  const qualified = new Map<string, string>();
  const bare = new Map<string, string | null>();
  for (const m of source.matchAll(CONST_RE)) {
    const owner = owners.findLast((o) => o.at < m.index)?.name ?? "";
    const value = m[2].toLowerCase();
    qualified.set(`${owner}.${m[1]}`, value);
    bare.set(m[1], bare.has(m[1]) && bare.get(m[1]) !== value ? null : value);
  }
  return { qualified, bare };
}

/** The text inside every parenthesised group short enough to be one call's arguments. */
function* argumentLists(source: string): Generator<string> {
  const open: number[] = [];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "(") open.push(i);
    else if (source[i] === ")" && open.length) {
      const from = open.pop()! + 1;
      if (i - from <= MAX_LIST_CHARS) yield source.slice(from, i);
    }
  }
}

/** The addresses a list names, literal or by constant, in order and once each. */
function addressesOf(list: string, syms: Symbols): string[] {
  const out = new Set<string>();
  for (const m of list.matchAll(TOKEN_RE)) {
    const literal = m[0].startsWith("0x") && m[0].length === 42 ? m[0].toLowerCase() : null;
    const named = m[1] ? syms.qualified.get(`${m[1]}.${m[2]}`) : syms.bare.get(m[2]);
    const a = literal ?? named;
    if (a) out.add(a);
  }
  return [...out];
}

/** Every ordered pair of distinct addresses one argument list of `source` names, as `a,b`. */
export function argumentPairs(source: string): string[] {
  const text = source.replace(/\\[nrt]/g, " ");
  const syms = symbolsOf(text);
  const pairs = new Set<string>();
  for (const list of argumentLists(text)) {
    const xs = addressesOf(list, syms);
    if (xs.length < 2 || xs.length > MAX_LIST_ADDRESSES) continue;
    for (const a of xs) for (const b of xs) if (a !== b) pairs.add(`${a},${b}`);
  }
  return [...pairs].sort();
}
