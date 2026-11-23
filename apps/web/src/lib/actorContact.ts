import type { RelationEdge } from "@/types";
import { parseMeta } from "@/lib/meta";
import type { ActorContact } from "./actorTypes";

export function buildActorContact(edges: readonly RelationEdge[], entityId: string): ActorContact {
  const contact: ActorContact = { channels: [], emergency: [] };
  for (const e of edges) {
    if (e.t !== entityId || e.ft !== "doc") continue;
    if (e.e === "governance_channel") {
      const m = parseMeta<{ platform: "forum" | "discord"; category?: string; url?: string }>(e.m);
      if (m?.platform) contact.channels.push({ platform: m.platform, category: m.category, url: m.url, docId: e.f });
    } else if (e.e === "emergency_response") {
      const m = parseMeta<{ scope: "ecosystem" | "agent_specific"; status: string }>(e.m);
      if (m?.scope) contact.emergency.push({ scope: m.scope, status: m.status, docId: e.f });
    }
  }
  contact.channels.sort((a, b) => (a.platform === b.platform ? 0 : a.platform === "forum" ? -1 : 1));
  contact.emergency.sort((a, b) => (a.scope === b.scope ? 0 : a.scope === "ecosystem" ? -1 : 1));
  return contact;
}
