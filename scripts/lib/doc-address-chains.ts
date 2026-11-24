// The chain one doc places each address it states on: build-index merges these
// into each address's primary chain and `chains` (docAddressChains), and the
// mentions edge reads every placement the doc makes (docPlacements,
// graph-entity-edges/mentions.mjs).
import { ETH_ADDR_RE, SOL_ADDR_RE, chainFromLabel, detectChainSignal, normalizeAddress } from "./address-chains.mjs";

/** One address as one doc places it; `detected` is whether anything in the doc named a chain. */
export interface DocAddressChain {
  chain: string;
  candidates: string[];
  detected: boolean;
}

type TitledNode = { doc_no: string; title: string };

/**
 * Chain named by a node's own title, else by its nearest doc_no ancestor that
 * names one. Atomized docs put the chain in a heading — either inline
 * ("ALM Proxy (Optimism) Contract") or as a bare per-chain grouping heading
 * ("Monolithic ALM Contracts" > "Robinhood Chain" > "ALM Proxy Contract") — and
 * the one-line body never repeats it. Walks doc_no rather than parentId because
 * heading depth is capped at 6, which collapses the parent chain for the deeply
 * nested artifact subtrees where this pattern lives.
 */
export function titleChainFor(node: TitledNode, nodeByDocNo: Map<string, TitledNode>): string | null {
  const parts = node.doc_no.split(".");
  for (let i = parts.length; i > 0; i--) {
    const ancestor = i === parts.length ? node : nodeByDocNo.get(parts.slice(0, i).join("."));
    const hit = ancestor && chainFromLabel(ancestor.title);
    if (hit) return hit;
  }
  return null;
}

/** Each address in `content`, placed by the first occurrence: prose first, then the doc's heading context, then the ethereum default. */
export function docAddressChains(content: string, titleChain: string | null): Record<string, DocAddressChain> {
  const result: Record<string, DocAddressChain> = {};
  ETH_ADDR_RE.lastIndex = 0;
  let m;
  while ((m = ETH_ADDR_RE.exec(content)) !== null) {
    const key = normalizeAddress(m[0]);
    if (result[key]) continue;
    const sig = detectChainSignal(content, m.index);
    const detected = sig?.chain ?? titleChain;
    // An explicit "on <chain> is" clause settles it outright — the heading is
    // then just the entity's name, and a name may well contain a different
    // chain word: the "Grove Arbitrum governance relay receiver on Robinhood
    // Chain" is named for the governance it relays, and only exists on
    // Robinhood. Absent one, prose and heading are both guesses: keep both and
    // let build-addresses settle it against the chains themselves.
    const candidates = sig?.explicit ? [sig.chain] : sig?.chain && titleChain && titleChain !== sig.chain ? [sig.chain, titleChain] : detected ? [detected] : [];
    result[key] = { chain: detected ?? "ethereum", candidates, detected: detected != null };
  }
  SOL_ADDR_RE.lastIndex = 0;
  while ((m = SOL_ADDR_RE.exec(content)) !== null) {
    const key = normalizeAddress(m[0]);
    // The base58 shape is itself the signal, so this counts as detected.
    result[key] ??= { chain: "solana", candidates: ["solana"], detected: true };
  }
  return result;
}

/** Where a doc places an address at one occurrence; `stated` when an explicit "on <chain> is" clause or the address's own shape (Solana) says so, not a nearby keyword or a heading. */
export interface Placement {
  chain: string;
  stated: boolean;
}

/** Every distinct chain a doc places each address on, over all its occurrences: by the prose at each, else the doc's heading context. */
export function docPlacements(content: string, titleChain: string | null): Record<string, Placement[]> {
  const out: Record<string, Placement[]> = {};
  const add = (key: string, p: Placement) => {
    const list = (out[key] ??= []);
    const same = list.find((x) => x.chain === p.chain);
    if (same) same.stated ||= p.stated;
    else list.push(p);
  };
  ETH_ADDR_RE.lastIndex = 0;
  let m;
  while ((m = ETH_ADDR_RE.exec(content)) !== null) {
    const sig = detectChainSignal(content, m.index);
    const chain = sig?.chain ?? titleChain;
    if (chain) add(normalizeAddress(m[0]), { chain, stated: !!sig?.explicit });
  }
  SOL_ADDR_RE.lastIndex = 0;
  while ((m = SOL_ADDR_RE.exec(content)) !== null) add(normalizeAddress(m[0]), { chain: "solana", stated: true });
  return out;
}
