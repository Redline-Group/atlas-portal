// Phase 1 of build-graph: entity extraction.

import { slugify } from "./graph-patterns.mjs";
import { attachPrimeRateLimitParams } from "./graph-prime-rate-limits.ts";
import { addSkyCoreHalos } from "./graph-halos.ts";
import type { Doc, Entity } from "./graph-records.ts";
import { createContext, type AddressInfo, type EntityCtx } from "./graph-entities/context.ts";
import { addBootstrapEntities, addPrimeAgents, addExecutorAgents, addAssignedOrgs } from "./graph-entities/agents.ts";
import { addResponsibleParties, addErgMembers, addGrantRecipients } from "./graph-entities/named-actors.ts";
import { addAddressLabelDelegates, addAlignedDelegates, addRankedDelegates } from "./graph-entities/delegates.ts";
import { addActorRoleBindings, addDesignatedRoleBindings, addSpellTeams } from "./graph-entities/role-bindings.ts";
import { addAccordParties, resolveAccordMember } from "./graph-entities/accord-parties.ts";
import { addPrimitiveInstances, addPrimitives } from "./graph-entities/primitives.ts";
import { addAgentLegalEntities } from "./graph-entities/legal-entities.ts";

// Order is load-bearing: an earlier step's entity keeps its slug, type and provenance.
const STEPS: ((ctx: EntityCtx) => void)[] = [
  addBootstrapEntities, // 1a
  addPrimeAgents, // 1b
  addExecutorAgents, // 1c
  addAssignedOrgs, // 1d, 1e
  addResponsibleParties, // 1f
  addErgMembers, // 1g
  addAddressLabelDelegates, // 1h
  addAlignedDelegates, // 1i
  addRankedDelegates, // 1j
  addActorRoleBindings, // 1k
  addDesignatedRoleBindings, // 1k1
  addSpellTeams, // 1k2
  addGrantRecipients, // 1l
  addAccordParties, // 1m
  (ctx) => attachPrimeRateLimitParams(ctx.entityMap, ctx.docById, ctx.childrenByDocNo),
  (ctx) => void addSkyCoreHalos(ctx.allDocs, ctx.childrenByDocNo, ctx.addEntity),
  addPrimitiveInstances, // 1n
  addPrimitives, // 1o
  addAgentLegalEntities, // 1p
];

// Untyped callers parse `meta` without a null check, so the returned map is loose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseEntityMap = Map<string, any>;

function indexByDefiningDoc(entityMap: Map<string, Entity>): Map<string, Entity> {
  const entityByDocId = new Map<string, Entity>();
  for (const e of entityMap.values()) {
    if (e.defining_doc_id) entityByDocId.set(e.defining_doc_id, e);
  }
  return entityByDocId;
}

export function extractEntities(
  allDocs: Doc[],
  docById: Map<string, Doc>,
  docByDocNo: Map<string, Doc>,
  addressesRaw: Record<string, AddressInfo>,
) {
  const ctx = createContext(allDocs, docById, docByDocNo, addressesRaw);
  for (const step of STEPS) step(ctx);
  return {
    entityMap: ctx.entityMap as LooseEntityMap,
    entityByDocId: indexByDefiningDoc(ctx.entityMap),
    entityByName: (name: string) => ctx.entityMap.get(slugify(name)),
    labelToAddresses: ctx.labelToAddresses,
    alignedDelegateNames: ctx.alignedDelegateNames,
    rankedDelegatesByLevel: ctx.rankedDelegatesByLevel,
    roleBindings: ctx.roleBindings,
    ergDoc: ctx.ergDoc,
    ergMemberNames: ctx.ergMemberNames,
    accordPartyDocsByAccordDocNo: ctx.accordPartyDocsByAccordDocNo,
    resolveAccordMember: (rawName: string, sourceDocNo: string) => resolveAccordMember(ctx, rawName, sourceDocNo),
  };
}
