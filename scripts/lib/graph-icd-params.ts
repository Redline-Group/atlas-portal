// What an instance's ICD parameters say about the addresses they hold: the role
// each key names, the chain the ICD states, and the label Phase 4.5a gives the
// address. Shared by build-graph Phase 2.5 (has_address) and the mentions
// pattern, so an address stated by an ICD param doc gets one node id from both.
import { ETH_ADDR_EXACT_RE, SOL_ADDR_EXACT_RE, normalizeAddress } from "./address-chains.mjs";
import { normalizeChainLabel } from "./chains.mjs";

type Params = Record<string, [string, ...unknown[]]>;

// Param keys that contain addresses, mapped to role tags.
// "Token Address (ERC4626 Vault)" is a vault contract, not a token — handled
// by the prefix rule in icdParamRole(). Bare "Address" is too ambiguous
// (appears in Pioneer Chain ICDs with no stable meaning) and is omitted.
const ICD_PARAM_ROLES = new Map([
  ["Integration Partner Reward Address", "integration-boost-reward"],
  ["Token Address", "token"],
  ["Underlying Asset Address", "underlying-asset"],
  ["Pool Address", "pool"],
  ["Allocator Role Address", "allocator-role"],
]);

// A pool with several underlying assets names each in a suffix ("Underlying
// Asset Address (USDC)"): the suffix says which asset, not a different role.
const SUFFIXED = new Set(["Underlying Asset Address", "Pool Address"]);

/**
 * The key a param's role and label are read from. A key that collided with a
 * sibling keeps its section before " / " (graph-instances.mjs addLeafParams),
 * and a suffix on a SUFFIXED key is dropped. "Token Address (…)" keeps its
 * suffix: it names the token's chain or the vault type.
 */
function roleKey(key: string): string {
  const leaf = key.split(" / ").at(-1) ?? key;
  const bare = leaf.replace(/\s*\([^)]*\)$/, "");
  return SUFFIXED.has(bare) ? bare : leaf;
}

/**
 * How firmly a param names its address, for the label Phase 4.5a gives it: an
 * exact role key outranks a suffixed or collision-renamed one, which only fills
 * a label no exact key gave, whatever order the instances are read in.
 */
export const icdLabelRank = (key: string) => (ICD_PARAM_ROLES.has(key) || key.startsWith("Token Address (") ? 0 : 1);

export function icdParamRole(key: string): string | null {
  const leaf = roleKey(key);
  if (ICD_PARAM_ROLES.has(leaf)) return ICD_PARAM_ROLES.get(leaf)!;
  if (leaf.startsWith("Token Address (")) return /ERC4626/i.test(leaf) ? "vault" : "token";
  return null;
}

const normalizeChain = (raw: string) => normalizeChainLabel(raw, "icd-chain");

// Returns the chain the ICD itself names, or null when it names none. The
// caller supplies the default: "named nothing" must stay distinguishable from
// "named ethereum", because Phase 4.5a writes this back over the chain
// build-index detected and would otherwise reset every unlabelled ICD address
// to ethereum.
export function icdParamChain(key: string, params: Params): string | null {
  const leaf = roleKey(key);
  if (leaf.startsWith("Token Address (")) {
    const m = leaf.match(/\(([^)]+)\)/);
    if (m && !/ERC4626/i.test(m[1])) return normalizeChain(m[1]);
  }
  const raw = params["Integration Partner Chain"]?.[0] ?? params["Network"]?.[0];
  return raw ? normalizeChain(raw) : null;
}

export function icdParamLabel(key: string, params: Params, agentName: string | null, instanceName: string): string {
  const leaf = roleKey(key);
  if (leaf === "Integration Partner Reward Address") {
    const partner = params["Integration Partner Name"]?.[0];
    return partner ? `${partner} (IB reward)` : instanceName;
  }
  if (leaf.startsWith("Token Address")) return params["Token Symbol"]?.[0] ?? params["Token Name"]?.[0] ?? instanceName;
  if (leaf === "Pool Address") {
    const protocol = params["Target Protocol"]?.[0];
    return protocol ? `${protocol} Pool (${agentName ?? instanceName})` : instanceName;
  }
  if (leaf === "Underlying Asset Address") {
    // A suffixed key names the asset itself ("Underlying Asset Address (AUSD)").
    const named = key.split(" / ").at(-1)?.match(/\(([^)]+)\)$/)?.[1];
    if (named) return named;
    const token = params["Token"]?.[0] ?? params["Token Symbol"]?.[0];
    return token ? `${token} underlying asset` : instanceName;
  }
  if (leaf === "Allocator Role Address") return agentName ? `${agentName} allocator role` : instanceName;
  return instanceName;
}

type Hit = { addr: string; isSol: boolean };

/** An ICD param holding one address under a role key: the address and whether it is a Solana one. */
export function icdParamAddress(key: string, value: string): Hit | null {
  if (!icdParamRole(key)) return null;
  const isEvm = ETH_ADDR_EXACT_RE.test(value);
  const isSol = !isEvm && SOL_ADDR_EXACT_RE.test(value);
  return isEvm || isSol ? { addr: normalizeAddress(value), isSol } : null;
}

/** The chain of a param's has_address node: the one the ICD names, else ethereum. The mentions edge from the param's doc lands on the same node. */
export const icdEdgeChain = (hit: Hit, key: string, params: Params) => (hit.isSol ? "solana" : (icdParamChain(key, params) ?? "ethereum"));

export interface IcdAnnotation {
  roles: string[];
  entityLabel: string;
  rank: number;
  chain: string | null;
  chainRank: number;
}

/**
 * Folds one param into its address's annotation. The label comes from the
 * best-ranked key (icdLabelRank) and the chain from the best-ranked key that
 * names one, the first of equals in each, so instance order decides neither.
 */
export function mergeIcdAnnotation(into: Map<string, IcdAnnotation>, addr: string, p: { role: string; label: string; chain: string | null; rank: number }) {
  const ann = into.get(addr);
  if (!ann) return void into.set(addr, { roles: [p.role], entityLabel: p.label, rank: p.rank, chain: p.chain, chainRank: p.chain ? p.rank : Infinity });
  if (!ann.roles.includes(p.role)) ann.roles.push(p.role);
  if (p.rank < ann.rank) Object.assign(ann, { entityLabel: p.label, rank: p.rank });
  if (p.chain && p.rank < ann.chainRank) Object.assign(ann, { chain: p.chain, chainRank: p.rank });
}

type Entity = { entity_type: string; meta?: string | null };

function paramsOf(ent: Entity): Params | null {
  if (ent.entity_type !== "instance" && ent.entity_type !== "invocation") return null;
  try {
    return (JSON.parse(ent.meta ?? "{}") as { params?: Params }).params ?? {};
  } catch {
    return null;
  }
}

/** For each ICD param doc (by doc_no), the chains of the has_address nodes its params point each address at (icdEdgeChain); an Agent Token leaf expanded per chain holds several. */
export function icdStatedChains(entities: Iterable<Entity>): Map<string, Map<string, Set<string>>> {
  const out = new Map<string, Map<string, Set<string>>>();
  for (const ent of entities) {
    const params = paramsOf(ent);
    for (const [key, [value, , srcDocNo]] of Object.entries(params ?? {})) {
      const hit = icdParamAddress(key, value);
      if (!hit || typeof srcDocNo !== "string") continue;
      const byAddr = out.get(srcDocNo) ?? out.set(srcDocNo, new Map()).get(srcDocNo)!;
      byAddr.set(hit.addr, (byAddr.get(hit.addr) ?? new Set()).add(icdEdgeChain(hit, key, params!)));
    }
  }
  return out;
}
