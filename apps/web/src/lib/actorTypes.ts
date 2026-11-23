import type { AtlasNode, GraphEntity, RelationEdge } from "@/types";
import type { RewardsAgent } from "@/lib/rewardsTypes";
import type { ActiveDataRow } from "@/lib/activeDataIndex";
import type { InstanceParam } from "@/lib/radarRules";
import type { RadarInstance } from "./radarInstance";
import type { RelationSourceDoc } from "./relationSources";

export type { InstanceParam, RadarInstance };

export interface ChainNode {
  id: string;
  slug: string;
  name: string;
  et: string;
  st: string | null;
  docId: string | null;
}
export interface ActorChain {
  /** The agents an executor operates: Prime Agents and Halo Agents. On such an agent's own page, itself. */
  served: ChainNode[];
  executors: ChainNode[];
  facilitators: ChainNode[];
  govops: ChainNode[];
}
export interface ActorRelation {
  edge: RelationEdge;
  /** The documents the edge was read from, resolved from the profile's docs. */
  sourceDocs: RelationSourceDoc[];
  direction: "outbound" | "inbound";
  otherLabel: string;
  otherId: string;
  otherSlug: string | null;
  otherEt: string | null;
}
export interface RadarPrimitive {
  title: string;
  docId: string | null;
  st: string;
  category: string | null;
  categoryDocId: string | null;
  categoryOrder: number;
  status: string | null;
  /** The Global Activation Status document that states `status` (the primitive's `has_status` target). */
  statusDocId: string | null;
  isUnknown: boolean;
  instances: RadarInstance[];
  // Invocations share the RadarInstance shape (same ICD-derived fields) but
  // are a distinct concept per atlas A.2.2.1.4 — kept in a separate array so
  // the UI can render them as a peer section instead of conflating with
  // operational instance statuses.
  invocations: RadarInstance[];
}
// Contact surface for a Prime Agent — its governance channels (Sky Forum
// category, Discord URL) and emergency-response docs. Sourced from the
// Pattern 22 governance_channel / emergency_response edges (doc → entity).
export interface ContactChannel {
  platform: "forum" | "discord";
  category?: string;
  url?: string;
  docId: string;
}
export interface ContactEmergency {
  scope: "ecosystem" | "agent_specific";
  status: string; // "placeholder" (not yet written) | "specified"
  docId: string;
}
export interface ActorContact {
  channels: ContactChannel[];
  emergency: ContactEmergency[];
}
export interface Recommendation {
  kind: "missing-rp" | "governance-edge" | "no-rewards";
  label: string;
  detail: string;
  reportLink?: string;
  entityLink?: string;
}
export interface ActorProfile {
  entity: GraphEntity;
  definingDoc: AtlasNode | null;
  chain: ActorChain;
  adRows: ActiveDataRow[];
  rewardsAgent: RewardsAgent | null;
  relations: ActorRelation[];
  instances: RadarInstance[];
  invocations: RadarInstance[];
  primitives: RadarPrimitive[];
  recommendations: Recommendation[];
  comprisesMembers: { name: string; slug: string | null }[];
  partOfComposite: { name: string; slug: string | null } | null;
  contact: ActorContact;
}
export type SidebarActor = ChainNode;
export interface SidebarGroup {
  label: string;
  actors: SidebarActor[];
}
