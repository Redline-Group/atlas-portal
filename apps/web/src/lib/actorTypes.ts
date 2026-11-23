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
  /** On a served agent's own page, itself. */
  served: ChainNode[];
  executors: ChainNode[];
  facilitators: ChainNode[];
  govops: ChainNode[];
}
export interface ActorRelation {
  edge: RelationEdge;
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
  statusDocId: string | null;
  isUnknown: boolean;
  instances: RadarInstance[];
  // Same shape as instances but a distinct concept, so kept apart for the UI.
  invocations: RadarInstance[];
}
export interface ContactChannel {
  platform: "forum" | "discord";
  category?: string;
  url?: string;
  docId: string;
}
export interface ContactEmergency {
  scope: "ecosystem" | "agent_specific";
  status: string; // "placeholder" | "specified"
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
