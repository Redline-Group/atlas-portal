// The one object every Phase 1 step receives: the atlas lookups, the entity
// registry, and the results Phase 2 reads back. Steps run in the order
// graph-entities.ts lists; an earlier step has first claim on a slug.
import { slugify } from "../graph-patterns.mjs";
import { buildChildrenIndex, buildKnownPrimitives } from "../graph-instances.mjs";
import { entityAdder, type AddEntity, type Doc, type Entity } from "../graph-records.ts";

export interface AddressInfo {
  label?: string;
  chain?: string;
  roles?: string[];
}
export interface RoleBinding {
  holder: Entity;
  bindingDoc: Doc;
  roleSlug: string;
}
export interface AccordPartyDoc {
  partyEntity: Entity;
  sourceDocNo: string;
  memberStr: string;
  isSky: boolean;
}

/** What Phase 1 hands to Phase 2 beside the entity registry. */
export interface EntityResults {
  labelToAddresses: Map<string, { addr: string; chain: string }[]>;
  alignedDelegateNames: string[];
  /** level → [{name, docNo}] */
  rankedDelegatesByLevel: Map<number, { name: string; docNo: string }[]>;
  roleBindings: RoleBinding[];
  ergDoc: Doc | undefined;
  ergMemberNames: string[];
  /** accord doc_no → its party-details docs */
  accordPartyDocsByAccordDocNo: Map<string, AccordPartyDoc[]>;
}

export interface EntityCtx extends EntityResults {
  allDocs: Doc[];
  docById: Map<string, Doc>;
  docByDocNo: Map<string, Doc>;
  /** Direct children by parent doc_no, in atlas order. */
  childrenByDocNo: Map<string, Doc[]>;
  /** Titles the "Current Primitives" doc lists. */
  knownPrimitives: Set<string>;
  addressesRaw: Record<string, AddressInfo>;
  /** slug → entity record */
  entityMap: Map<string, Entity>;
  addEntity: AddEntity;
}

const emptyResults = (): EntityResults => ({
  labelToAddresses: new Map(),
  alignedDelegateNames: [],
  rankedDelegatesByLevel: new Map(),
  roleBindings: [],
  ergDoc: undefined,
  ergMemberNames: [],
  accordPartyDocsByAccordDocNo: new Map(),
});

export function createContext(
  allDocs: Doc[],
  docById: Map<string, Doc>,
  docByDocNo: Map<string, Doc>,
  addressesRaw: Record<string, AddressInfo>,
): EntityCtx {
  const entityMap = new Map<string, Entity>();
  return {
    allDocs,
    docById,
    docByDocNo,
    childrenByDocNo: buildChildrenIndex(allDocs),
    knownPrimitives: buildKnownPrimitives(docById),
    addressesRaw,
    entityMap,
    addEntity: entityAdder(entityMap),
    ...emptyResults(),
  };
}

/** Get-or-create the entity a document names, recording that document as its source. */
export function addNamedEntity(ctx: EntityCtx, name: string, entityType: string, doc: Doc, source: string): Entity {
  return ctx.addEntity(slugify(name), name, entityType, null, doc.id, { source, source_doc_no: doc.doc_no });
}

/** Sky Core, the bootstrap entity the first step always registers. */
export const skyCoreOf = (ctx: EntityCtx): Entity => ctx.entityMap.get("sky-core") as Entity;
