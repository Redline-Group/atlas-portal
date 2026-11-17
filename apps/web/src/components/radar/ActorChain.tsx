import { Link } from "../Link";
import { ENTITY_TYPE_COLOR } from "../../lib/entityGraph";
import { actorHref } from "@/lib/routes";
import type { ActorChain, ChainNode } from "../../lib/actorIndex";
import { SourceMark } from "../SourceMark";

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

  const groups: ChainGroup[] = [
    { role: "Prime Agent", nodes: others(primes) },
    { role: "Executor Agent", nodes: others(executors) },
    { role: "Facilitator", nodes: others(facilitators) },
    { role: "GovOps", nodes: others(govops) },
  ].filter((g) => g.nodes.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="mono text-[10px] uppercase tracking-wider" style={{ color: "var(--tan-3)" }}>
          Related Parties
        </h2>
        <SourceMark source="derived" bare hint="Found by following role edges across several hops; the Atlas does not list them in one place." />
      </div>
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
