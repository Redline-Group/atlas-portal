// has_address, agent → its SubProxy Account and StarGuard Contract. A Prime
// states them as params of its Agent Creation instance; a Sky Core Halo states
// them on its own entity. The edge's meta names the param and the role.
import { ETH_ADDR_EXACT_RE, normalizeAddress } from "../address-chains.mjs";
import { normalizeChainLabel } from "../chains.mjs";

const ROLE: Record<string, string> = { "SubProxy Account": "subproxy", "StarGuard Contract": "starguard" };
const CONTRACT_PARAM_RE = new RegExp(`^(${Object.keys(ROLE).join("|")}) / (.+)$`);

/** The agent an entity's contract params belong to: itself, or its Agent Creation instance's agent. */
function ownerOf(ctx: any, entity: any, meta: any) {
  if (entity.entity_type === "agent") return entity;
  return entity.subtype === "agent-creation" && meta.agent_doc_id ? ctx.entityByDocId.get(meta.agent_doc_id) : null;
}

function run(ctx: any) {
  for (const entity of ctx.entityMap.values()) {
    const meta = entity.meta ? JSON.parse(entity.meta) : {};
    const owner = meta.params ? ownerOf(ctx, entity, meta) : null;
    if (!owner) continue;
    for (const [key, [value, , srcDocNo]] of Object.entries(meta.params) as [string, [string, string, string]][]) {
      const m = key.match(CONTRACT_PARAM_RE);
      if (!m || !ETH_ADDR_EXACT_RE.test(value)) continue;
      const chain = normalizeChainLabel(m[2], "icd-chain");
      ctx.addEdge(owner.id, "entity", `${normalizeAddress(value)}:${chain}`, "address", "has_address", [srcDocNo], JSON.stringify({ param: key, role: ROLE[m[1]] }));
    }
  }
}

export const pattern = { id: "2u-agent", run };
