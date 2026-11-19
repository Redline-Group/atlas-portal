// operational_executor_agent_for, executor → Sky Core Halo. Source: the general
// rule "Operational Executor Agent For Sky Core Halos", whose content cites the
// executor's defining doc and applies to every Sky Core Halo.
import { UUID_LINK_RE } from "../graph-patterns.mjs";

const RULE_TITLE_RE = /^Operational Executor Agent For Sky Core Halos$/i;

function run(ctx: any) {
  const halos = [...ctx.entityMap.values()].filter((e: any) => e.subtype === "halo");
  const rules = ctx.allDocs.filter((d: any) => RULE_TITLE_RE.test(d.title));
  if (halos.length > 0 && rules.length === 0)
    console.warn("  [drift] tripwire: Sky Core Halos exist but no executor rule document was found — their operational_executor_agent_for edges will be empty (rule title in halo-executor-for.ts likely renamed)");
  for (const rule of rules) {
    const cited = [...(rule.content ?? "").matchAll(UUID_LINK_RE)].map((m) => ctx.entityByDocId.get(m[2])).find((e) => e?.subtype === "operational_executor");
    if (!cited) {
      console.warn(`  [drift] Sky Core Halo executor rule (${rule.doc_no}) found but it cites no Operational Executor Agent`);
      continue;
    }
    for (const halo of halos) ctx.addEdge(cited.id, "entity", halo.id, "entity", "operational_executor_agent_for", [rule.doc_no]);
  }
}

export const pattern = { id: "2j-halo", run };
