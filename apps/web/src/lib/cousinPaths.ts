import chainRegistry from "@/data/chain-registry.json";
import { isStatusDirectory } from "@/lib/cousinFiling";
import { chainInText } from "@/lib/pauInstanceChain";

type Key = (title: string | undefined) => string;

// Every word of every registry chain name, plus the words chain headings add
// around a name ("Robinhood Chain", "Ethereum Mainnet Instances").
const CHAIN_WORDS = new Set([
  ...chainRegistry.chains.flatMap((c) => [c.chain, ...(c.proseHints ?? []), ...(c.aliases ?? [])]).flatMap((n) => n.toLowerCase().split(/\s+/)),
  "chain",
  "instances",
]);

/** A word of some chain's name ("ethereum", "mainnet", "base", "chain"). */
export const isChainWord = (word: string): boolean => CHAIN_WORDS.has(word.toLowerCase());

/** A heading that only names a chain: "Base", "Robinhood Chain", "Ethereum Mainnet Instances". */
export const isChainHeading = (title: string): boolean => {
  const words = title.trim().toLowerCase().split(/\s+/);
  return words.every((w) => CHAIN_WORDS.has(w)) && chainInText(title) !== null;
};

// A Liquidity Layer section that names no chain is the Ethereum Mainnet one; a
// "Foreign" controller is the non-mainnet architecture, its own mark.
const DEFAULT_CHAIN = "ethereum";
const FOREIGN = "foreign";

export interface PathMarks {
  /** Heading title keys, nearest first, without the headings that only name a chain. */
  steps: string[];
  chains: Set<string>;
  /** Title key of the status heading it sits under ("Active Instances", "Completed Instances Directory"). */
  status?: string;
}

/** What a path of headings (nearest first) pins down. */
export function pathMarks(titles: string[], key: Key): PathMarks {
  const chains = new Set<string>();
  for (const t of titles) {
    const chain = chainInText(t);
    if (chain) chains.add(chain);
    if (/\bforeign\b/i.test(t)) chains.add(FOREIGN);
  }
  const status = titles.find((t) => isStatusDirectory(t));
  return { steps: titles.filter((t) => !isChainHeading(t)).map(key), chains, status: status === undefined ? undefined : key(status) };
}

const chainsOrDefault = (m: PathMarks) => (m.chains.size ? m.chains : new Set([DEFAULT_CHAIN]));

/** Two paths contradict when they name different chains or sit under different status headings; a heading one side lacks is no contradiction. */
export function contradicts(a: PathMarks, b: PathMarks): boolean {
  if (a.chains.size || b.chains.size) {
    const bc = chainsOrDefault(b);
    if (![...chainsOrDefault(a)].some((c) => bc.has(c))) return true;
  }
  return a.status !== undefined && b.status !== undefined && a.status !== b.status;
}

/** Leading headings two paths share, nearest first. */
export function sharedRun(a: string[], b: string[]): number {
  let k = 0;
  while (k < a.length && k < b.length && a[k] === b[k]) k++;
  return k;
}
