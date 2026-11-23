import { pushTo } from "../../../src/lib/collections.ts";
import { slugify, isPartyDetails, COMPRISES_RE, ATOMIC_PARTY_RE } from "../graph-patterns.mjs";
import { parseNameList } from "../graph-content-extract.ts";
import type { Doc, Entity } from "../graph-records.ts";
import { skyCoreOf, type EntityCtx } from "./context.ts";

const SKY_PARTY_RE = /^Sky$/i;

export function resolveAccordMember(ctx: EntityCtx, rawName: string, sourceDocNo: string): Entity {
  const cleaned = rawName.replace(/^the\s+/i, "").trim();

  if (/^Sky Core$/i.test(cleaned)) return skyCoreOf(ctx);

  const stripped = cleaned.replace(/\s+(Prime Agent|Executor Agent)$/i, "").trim();
  const agent = stripped !== cleaned ? ctx.entityMap.get(slugify(stripped)) : undefined;
  if (agent) return agent;

  // Atlas convention: a non-agent, non-Foundation member is the development company.
  const inferredType = /\bFoundation$/i.test(cleaned) ? "foundation" : "development_company";
  const member = ctx.addEntity(slugify(cleaned), cleaned, inferredType, null, null, {
    source: "accord_party_member",
    source_doc_no: sourceDocNo,
  });
  if (member.entity_type === "ecosystem_actor") member.entity_type = inferredType;
  return member;
}

function parseParty(content: string | undefined): { partyName: string; memberStr: string } | null {
  const comprises = content?.match(COMPRISES_RE);
  if (comprises) return { partyName: comprises[1].trim(), memberStr: comprises[2] };
  const atomic = content?.match(ATOMIC_PARTY_RE);
  return atomic ? { partyName: atomic[1].trim(), memberStr: "" } : null;
}

function partyEntityFor(ctx: EntityCtx, partyName: string, d: Doc): Entity {
  if (SKY_PARTY_RE.test(partyName)) return skyCoreOf(ctx);
  // "-party" suffix so the party cannot collide with a member agent.
  return ctx.addEntity(`${slugify(partyName)}-party`, partyName, "composite_party", null, null, {
    source: "accord_party_composite",
    source_doc_no: d.doc_no,
  });
}

export function addAccordParties(ctx: EntityCtx): void {
  for (const d of ctx.allDocs.filter(isPartyDetails)) {
    const party = parseParty(d.content);
    if (!party) continue;
    const accordDocNo = d.doc_no.split(".").slice(0, 5).join(".");
    pushTo(ctx.accordPartyDocsByAccordDocNo, accordDocNo, {
      partyEntity: partyEntityFor(ctx, party.partyName, d),
      sourceDocNo: d.doc_no,
      memberStr: party.memberStr,
      isSky: SKY_PARTY_RE.test(party.partyName),
    });
    for (const memberName of parseNameList(party.memberStr)) resolveAccordMember(ctx, memberName, d.doc_no);
  }
}
