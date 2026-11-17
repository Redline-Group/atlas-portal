import { describe, expect, it } from "vitest";
import type { AtlasNode, GraphEntity, RelationEdge } from "@/types";
import { buildActorRelations } from "./actorRelations";

const ent = (id: string, name: string, slug: string | null = null): GraphEntity => ({ id, name, slug, et: "agent", st: null, did: null }) as unknown as GraphEntity;
const byId = new Map([["me", ent("me", "Me", "me")], ["x", ent("x", "Other", "other")]]);
const docs = { d1: { id: "d1", doc_no: "A.1.2" } as AtlasNode };
const edge = (f: string, t: string, s?: string[]): RelationEdge => ({ f, ft: "entity", t, tt: "entity", e: "facilitator_of", ...(s ? { s } : {}) }) as RelationEdge;

describe("buildActorRelations", () => {
  it("lists an edge on either side of the actor, with the other party and its source docs resolved", () => {
    const out = buildActorRelations([edge("me", "x", ["A.1.2", "A.9.9"]), edge("x", "me")], "me", byId, docs);
    expect(out.map((r) => [r.direction, r.otherLabel, r.otherSlug])).toEqual([["outbound", "Other", "other"], ["inbound", "Other", "other"]]);
    expect(out[0].sourceDocs).toEqual([{ docNo: "A.1.2", id: "d1" }, { docNo: "A.9.9", id: null }]);
    expect(out[1].sourceDocs).toEqual([]);
  });

  it("leaves out an edge that does not touch the actor or whose other end is not an entity", () => {
    expect(buildActorRelations([edge("x", "x"), edge("me", "ghost")], "me", byId, docs)).toEqual([]);
  });
});
