// The kinds of agent the graph holds, declared once. An agent entity's subtype
// (build-graph: graph-entities.mjs, graph-halos.ts) names its kind; every label,
// badge, sidebar group and roster heading for agents derives from here. A new
// subtype is one entry in AGENT_KINDS, plus a family when it is neither a
// served agent nor an executor like the ones below.

/** A family groups the subtypes a reader sees as one kind of agent. */
export const AGENT_FAMILIES = [
  // `served`: an Executor Agent operates agents of this family.
  { family: "prime", label: "Prime Agent", plural: "Prime Agents", served: true },
  { family: "executor", label: "Executor Agent", plural: "Executor Agents", served: false },
  { family: "halo", label: "Halo Agent", plural: "Halo Agents", served: true },
] as const;

export type AgentFamilyId = (typeof AGENT_FAMILIES)[number]["family"];
export type AgentFamily = (typeof AGENT_FAMILIES)[number];

/** `name` reads before "Agent" ("Operational Executor Agent"); `badge` is the short tag beside a name in a list. */
export const AGENT_KINDS = [
  { subtype: "prime", family: "prime", name: "Prime", badge: "Prime" },
  { subtype: "operational_executor", family: "executor", name: "Operational Executor", badge: "Exec" },
  { subtype: "core_executor", family: "executor", name: "Core Executor", badge: "Core Exec" },
  { subtype: "halo", family: "halo", name: "Halo", badge: "Halo" },
] as const satisfies readonly { subtype: string; family: AgentFamilyId; name: string; badge: string }[];

export type AgentKind = (typeof AGENT_KINDS)[number];

const KIND_BY_SUBTYPE: ReadonlyMap<string, AgentKind> = new Map(AGENT_KINDS.map((k) => [k.subtype, k]));
const FAMILY_BY_ID: ReadonlyMap<string, AgentFamily> = new Map(AGENT_FAMILIES.map((f) => [f.family, f]));

/** The kind an agent subtype names; null for a subtype the registry does not list. */
export const agentKind = (subtype: string | null | undefined): AgentKind | null => (subtype ? (KIND_BY_SUBTYPE.get(subtype) ?? null) : null);

/** The family of an agent subtype; null for a subtype the registry does not list. */
export function agentFamily(subtype: string | null | undefined): AgentFamily | null {
  const kind = agentKind(subtype);
  return kind ? (FAMILY_BY_ID.get(kind.family) ?? null) : null;
}

/** An Executor Agent subtype (operational or core). */
export const isExecutorSubtype = (subtype: string | null | undefined): boolean => agentKind(subtype)?.family === "executor";

/** A subtype an Executor Agent operates: a Prime Agent or a Halo Agent. */
export const isServedSubtype = (subtype: string | null | undefined): boolean => agentFamily(subtype)?.served === true;
