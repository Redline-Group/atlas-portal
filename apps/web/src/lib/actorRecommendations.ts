import type { GraphEntity } from "@/types";
import { ROUTES } from "@/lib/routes";
import type { RewardsAgent } from "@/lib/rewardsTypes";
import type { ActiveDataRow } from "@/lib/activeDataIndex";
import type { ActorRelation, Recommendation } from "./actorTypes";

const GOVERNANCE_PARTY_TYPES = ["governance_body", "composite_party"];

const NO_REWARDS: Recommendation = {
  kind: "no-rewards",
  label: "No DR or IB primitives found",
  detail: "This prime agent has no distribution reward or integration boost instances.",
  reportLink: ROUTES.REPORTS_REWARDS,
};

const governanceEdge = (r: ActorRelation): Recommendation => ({
  kind: "governance-edge",
  label: `Governance relationship: ${r.otherLabel}`,
  detail: `Edge type: ${r.edge.e}`,
  entityLink: r.otherSlug ?? undefined,
});

export function buildRecommendations(
  entity: GraphEntity,
  adRows: ActiveDataRow[],
  rewardsAgent: RewardsAgent | null,
  relations: ActorRelation[],
): Recommendation[] {
  const out: Recommendation[] = [];
  const missingRP = adRows.filter((r) => !r.responsibleParty).length;
  if (missingRP > 0)
    out.push({
      kind: "missing-rp",
      label: `${missingRP} AD doc${missingRP > 1 ? "s" : ""} without a responsible party`,
      detail: "These active data docs have no declared responsible party.",
      reportLink: ROUTES.REPORTS_ACTIVE_DATA,
    });
  if (entity.et === "agent" && entity.st === "prime" && !rewardsAgent) out.push(NO_REWARDS);
  const governance = relations.filter((r) => r.otherEt && GOVERNANCE_PARTY_TYPES.includes(r.otherEt));
  return [...out, ...governance.map(governanceEdge)];
}
