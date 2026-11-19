import { Address } from "../Address";
import { AtlasLink } from "../AtlasLink";
import { atlasHref } from "@/lib/routes";
import { parseMeta } from "@/lib/meta";
import { paramGist } from "@/lib/paramGist";
import { chainInText } from "@/lib/pauInstanceChain";
import type { GraphEntity } from "@/types";
import { Section } from "./RadarSection";

type Params = Record<string, [value: string, docId: string, docNo: string]>;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/** A Halo Agent's SubProxy, StarGuard and max delay, which it states on its own
 *  entity; nothing for other agents, whose instances state theirs. */
export function ActorContracts({ entity }: { entity: GraphEntity }) {
  const params = entity.st === "halo" ? (parseMeta<{ params?: Params }>(entity.m)?.params ?? {}) : {};
  const rows = Object.entries(params);
  if (rows.length === 0) return null;
  return (
    <Section title="Contracts">
      <table className="w-full text-sm border-collapse">
        <tbody>
          {rows.map(([key, [value, docId, docNo]]) => (
            <tr key={key} className="border-t border-[var(--border)]">
              <th scope="row" className="py-1.5 pr-4 mono text-[10px] w-56 align-top pt-2 text-left font-normal" style={{ color: "var(--tan-3)" }}>
                {key}
              </th>
              <td className="py-1.5" style={{ color: "var(--tan)" }}>
                {ADDRESS_RE.test(value) ? <Address address={value} chain={chainInText(key) ?? "ethereum"} /> : (paramGist(key, value) ?? value)}
              </td>
              <td className="py-1.5 pl-4 text-right">
                <AtlasLink to={atlasHref(docId)} className="mono text-[10px] text-accent hover:underline">
                  {docNo}
                </AtlasLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
