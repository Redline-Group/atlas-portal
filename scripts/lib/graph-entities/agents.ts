import { slugify, isPrimeAgent, isExecutorAgent, isFacilitatorDoc, isGovOpsDoc } from "../graph-patterns.mjs";
import { extractAssignment } from "../graph-content-extract.ts";
import { FACILITATOR_FOR_PREFIX, GOVOPS_FOR_PREFIX } from "../graph-entity-edges/assignment-prefixes.ts";
import { addNamedEntity, type EntityCtx } from "./context.ts";

const GOVERNANCE_BODIES = [
  { slug: "sky-governance", name: "Sky Governance", uuid: "18ac7dd3-c646-4352-9b0d-d01a2932d7d1" }, // A.1
  { slug: "support-facilitators", name: "Support Facilitators", uuid: "aeb75fe3-f52b-4cdf-a206-1e54ef648d88" }, // A.2.10.1.1
];

function definingDocNo(ctx: EntityCtx, uuid: string, what: string): string | undefined {
  const docNo = ctx.docById.get(uuid)?.doc_no;
  if (!docNo) console.warn(`  [drift] ${what}: defining doc ${uuid} not found in atlas`);
  return docNo;
}

// --- 1a. Bootstrap entities (Pattern 13) ---
export function addBootstrapEntities(ctx: EntityCtx): void {
  ctx.addEntity("sky-core", "Sky Core", "operational_party", null, null, { source: "bootstrap" });
  for (const { slug, name, uuid } of GOVERNANCE_BODIES) {
    ctx.addEntity(slug, name, "governance_body", null, uuid, {
      source: "bootstrap",
      defining_doc_no: definingDocNo(ctx, uuid, slug),
    });
  }
}

// --- 1b. Prime Agents (Pattern 1) ---
export function addPrimeAgents(ctx: EntityCtx): void {
  for (const d of ctx.allDocs.filter(isPrimeAgent)) ctx.addEntity(slugify(d.title), d.title, "agent", "prime", d.id).id = d.id;
}

// --- 1c. Executor Agents (Pattern 1) ---
// Core Council entries keep the full title: the number suffix IS their identity.
export function addExecutorAgents(ctx: EntityCtx): void {
  for (const d of ctx.allDocs.filter(isExecutorAgent)) {
    const isCore = /^Core Council Executor Agent/i.test(d.title);
    const name = isCore ? d.title : d.title.replace(/^Operational Executor Agent\s+/i, "").trim();
    const subtype = isCore ? "core_executor" : "operational_executor";
    ctx.addEntity(slugify(name), name, "agent", subtype, d.id).id = d.id;
  }
}

// --- 1d, 1e. Facilitators and GovOps (Pattern 5) ---
const ASSIGNED_ORGS = [
  { isDoc: isFacilitatorDoc, prefix: FACILITATOR_FOR_PREFIX, entityType: "facilitator_org", source: "facilitator_doc" },
  { isDoc: isGovOpsDoc, prefix: GOVOPS_FOR_PREFIX, entityType: "govops_org", source: "govops_doc" },
];

export function addAssignedOrgs(ctx: EntityCtx): void {
  for (const { isDoc, prefix, entityType, source } of ASSIGNED_ORGS) {
    for (const d of ctx.allDocs.filter(isDoc)) {
      const name = extractAssignment(d.content, prefix);
      if (name) addNamedEntity(ctx, name, entityType, d, source);
    }
  }
}
