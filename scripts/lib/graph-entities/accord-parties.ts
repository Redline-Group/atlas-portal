// Phase 1 step 1m: composite accord parties and their members (Pattern 12).
// Scans the A.2.8.2.Y.1.1.N party-details docs. Each party becomes a
// composite_party entity (slug suffix "-party" so it cannot collide with a
// member agent), and each member is resolved or created.
import { pushTo } from "../../../src/lib/collections.ts";
import { slugify, isPartyDetails, COMPRISES_RE, ATOMIC_PARTY_RE } from "../graph-patterns.mjs";
import { parseNameList } from "../graph-content-extract.ts";
import type { Doc, Entity } from "../graph-records.ts";
import { skyCoreOf, type EntityCtx } from "./context.ts";

const SKY_PARTY_RE = /^Sky$/i;

/** The entity a comprises-list member names; created when no entity holds the name. */
export function resolveAccordMember(ctx: EntityCtx, rawName: string, sourceDocNo: string): Entity {
  const cleaned = rawName.replace(/^the\s+/i, "").trim();

  // Sky Core special — party 'Sky' comprises Sky Core; always maps to bootstrap.
  if (/^Sky Core$/i.test(cleaned)) return skyCoreOf(ctx);

  // Strip "Prime Agent" or "Executor Agent" suffix to match short agent slugs.
  const stripped = cleaned.replace(/\s+(Prime Agent|Executor Agent)$/i, "").trim();
  const agent = stripped !== cleaned ? ctx.entityMap.get(slugify(stripped)) : undefined;
  if (agent) return agent;

  // Within an A.2.8.2.Y.1.1.N comprises list, any non-agent non-Foundation
  // member is a development_company by the atlas's positional convention
  // (e.g. "The party 'Spark' comprises the Spark Prime Agent, Spark Foundation,
  // and Phoenix Labs." — Phoenix Labs is the dev company). Foundation suffix
  // gives us the foundation vs dev-company split; no hardcoded name list needed.
  const inferredType = /\bFoundation$/i.test(cleaned) ? "foundation" : "development_company";
  const member = ctx.addEntity(slugify(cleaned), cleaned, inferredType, null, null, {
    source: "accord_party_member",
    source_doc_no: sourceDocNo,
  });
  // Upgrade an existing ecosystem_actor when the accord classifies it more
  // specifically (e.g. Phoenix Labs first seen in the ERG list, then confirmed
  // as dev-company via the Spark accord).
  if (member.entity_type === "ecosystem_actor") member.entity_type = inferredType;
  return member;
}

// "The party 'X' comprises A, B, and C." or, for a party without members,
// "The party 'X' is <descriptor>."
function parseParty(content: string | undefined): { partyName: string; memberStr: string } | null {
  const comprises = content?.match(COMPRISES_RE);
  if (comprises) return { partyName: comprises[1].trim(), memberStr: comprises[2] };
  const atomic = content?.match(ATOMIC_PARTY_RE);
  return atomic ? { partyName: atomic[1].trim(), memberStr: "" } : null;
}

// The "Sky" party maps directly to Sky Core (bootstrap) — no separate composite.
function partyEntityFor(ctx: EntityCtx, partyName: string, d: Doc): Entity {
  if (SKY_PARTY_RE.test(partyName)) return skyCoreOf(ctx);
  return ctx.addEntity(`${slugify(partyName)}-party`, partyName, "composite_party", null, null, {
    source: "accord_party_composite",
    source_doc_no: d.doc_no,
  });
}

export function addAccordParties(ctx: EntityCtx): void {
  for (const d of ctx.allDocs.filter(isPartyDetails)) {
    const party = parseParty(d.content);
    if (!party) continue;
    // Accord doc_no = first 5 parts of party-details doc_no (e.g. A.2.8.2.2 ← A.2.8.2.2.1.1.2)
    const accordDocNo = d.doc_no.split(".").slice(0, 5).join(".");
    pushTo(ctx.accordPartyDocsByAccordDocNo, accordDocNo, {
      partyEntity: partyEntityFor(ctx, party.partyName, d),
      sourceDocNo: d.doc_no,
      memberStr: party.memberStr,
      isSky: SKY_PARTY_RE.test(party.partyName),
    });
    // Resolve members now so they exist before edges are emitted in Phase 2.
    for (const memberName of parseNameList(party.memberStr)) resolveAccordMember(ctx, memberName, d.doc_no);
  }
}
