// Where key derivation's candidates come from: the explorer cache's ABIs
// (every zero-argument LIMIT_* view) and the address artifacts plus whatever
// extra the caller holds (the registry). The hashing itself is key-derive.ts.
import fs from "node:fs";
import path from "node:path";

type AbiItem = { type?: string; name?: string; inputs?: unknown[] };

/** Every entry of the explorer cache in `dir` (`<chainId>/<address>.json`); an unreadable or truncated file is left out. */
export function cachedEntries(dir: string): Record<string, unknown>[] {
  const files = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).flatMap((chain) => fs.readdirSync(path.join(dir, chain)).map((f) => path.join(dir, chain, f)));
  return files.flatMap((f) => {
    try {
      return [JSON.parse(fs.readFileSync(f, "utf8")) as Record<string, unknown>];
    } catch {
      return [];
    }
  });
}

/** A cached explorer entry's ABI; an unparsable one reads as none. */
function abiOf(entry: Record<string, unknown>): AbiItem[] {
  try {
    const abi = typeof entry.abi === "string" ? JSON.parse(entry.abi) : entry.abi;
    return Array.isArray(abi) ? abi : [];
  } catch {
    return [];
  }
}

/** Every zero-argument LIMIT_* view in the cached contract ABIs. */
export function limitConstants(dir = ".cache/etherscan"): string[] {
  const names = new Set<string>();
  for (const x of cachedEntries(dir).flatMap(abiOf)) if (x.type === "function" && /^LIMIT_/.test(x.name ?? "") && !x.inputs?.length) names.add(x.name!);
  return [...names].sort();
}

const ADDRESS_RE = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g;

/** An address artifact's addresses: addresses.json is keyed by address, addresses.atlas.json nests them under `addresses`. */
const addressKeys = (j: { addresses?: unknown }) => Object.keys(j.addresses && typeof j.addresses === "object" ? j.addresses : j);

/** Addresses the keys may be derived from: every one in the address artifacts that exist, plus the given extras. */
export function candidateAddresses(files: string[], extra: unknown): string[] {
  const out = new Set<string>();
  for (const f of files.filter((x) => fs.existsSync(x))) for (const a of addressKeys(JSON.parse(fs.readFileSync(f, "utf8")))) out.add(a);
  for (const m of JSON.stringify(extra).matchAll(ADDRESS_RE)) out.add(m[0]);
  return [...out].filter((a) => /^0x[0-9a-fA-F]{40}$/.test(a));
}
