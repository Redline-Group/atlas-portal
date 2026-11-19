import { describe, it, expect } from "vitest";
import { AGENT_FAMILIES, AGENT_KINDS, agentFamily, agentKind, isExecutorSubtype, isServedSubtype } from "./agentKinds";

describe("agent kinds", () => {
  it("gives every kind a family the registry declares, and every family a kind", () => {
    const families = new Set<string>(AGENT_FAMILIES.map((f) => f.family));
    for (const k of AGENT_KINDS) expect(families.has(k.family)).toBe(true);
    for (const f of AGENT_FAMILIES) expect(AGENT_KINDS.some((k) => k.family === f.family)).toBe(true);
  });

  it("lists each subtype, badge and family label once", () => {
    for (const values of [AGENT_KINDS.map((k) => k.subtype), AGENT_KINDS.map((k) => k.badge), AGENT_FAMILIES.map((f) => f.label), AGENT_FAMILIES.map((f) => f.plural)])
      expect(new Set(values).size).toBe(values.length);
  });

  it("reads a subtype's kind and family, and nothing for one it does not list", () => {
    expect(agentKind("core_executor")).toMatchObject({ name: "Core Executor", badge: "Core Exec" });
    expect(agentFamily("operational_executor")?.label).toBe("Executor Agent");
    expect(agentFamily("halo")?.plural).toBe("Halo Agents");
    for (const unknown of ["satellite", "", null, undefined]) {
      expect(agentKind(unknown)).toBeNull();
      expect(agentFamily(unknown)).toBeNull();
    }
  });

  it("names executors and the agents they operate positively", () => {
    expect(AGENT_KINDS.filter((k) => isExecutorSubtype(k.subtype)).map((k) => k.subtype)).toEqual(["operational_executor", "core_executor"]);
    expect(AGENT_KINDS.filter((k) => isServedSubtype(k.subtype)).map((k) => k.subtype)).toEqual(["prime", "halo"]);
    expect(isExecutorSubtype("satellite")).toBe(false);
    expect(isServedSubtype(null)).toBe(false);
  });
});
