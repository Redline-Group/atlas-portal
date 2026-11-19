import { Link } from "../Link";
import { ENTITY_TYPE_COLOR } from "../../lib/entityGraph";
import { actorHref } from "@/lib/routes";
import type { ActorChain, ChainNode } from "../../lib/actorIndex";
import { SourceMark } from "../SourceMark";
import { SectionTitle } from "./RadarSection";
import { AGENT_FAMILIES, agentFamily } from "@/lib/agentKinds";

const EXECUTOR_LABEL = AGENT_FAMILIES.find((f) => f.family === "executor")!.label;

interface Props {
  chain: ActorChain;
  currentSlug: string;
}

interface ChainGroup {
  role: string;
  nodes: ChainNode[];
}

export function ActorChain({ chain, currentSlug }: Props) {
  const { primes, executors, facilitators, govops } = chain;
  const others = (nodes: ChainNode[]) => nodes.filter((n) => n.slug !== currentSlug);
  // `primes` holds every agent an executor serves, one row per family.
  const served = others(primes);

  const groups: ChainGroup[] = [
    ...AGENT_FAMILIES.filter((f) => f.served).map((f) => ({ role: f.label, nodes: served.filter((n) => agentFamily(n.st) === f) })),
    { role: EXECUTOR_LABEL, nodes: others(executors) },
    { role: "Facilitator", nodes: others(facilitators) },
    { role: "GovOps", nodes: others(govops) },
  ].filter((g) => g.nodes.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="mb-6">
      <SectionTitle
        title="Related Parties"
        mark={<SourceMark source="derived" bare hint="Found by following role edges across several hops; the Atlas does not list them in one place." />}
      />
      <table className="w-full text-sm border-collapse">
        <tbody>
          {groups.map(({ role, nodes }) => (
            <tr key={role} className="border-t border-[var(--border)]">
              <td
                className="py-1.5 pr-4 mono text-[10px] w-36 align-top pt-2"
                style={{ color: "var(--tan-3)" }}
              >
                {role}
              </td>
              <td className="py-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {nodes.map((node) => (
                  <Link
                    key={node.id}
                    to={actorHref(node.slug)}
                    className="hover:underline"
                    style={{ color: ENTITY_TYPE_COLOR[node.et] ?? "var(--entity-fallback)" }}
                  >
                    {node.name}
                  </Link>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
