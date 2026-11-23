import { useMemo } from "react";
import { useLoaded } from "../../hooks/useAtlasData";
import { loadGraph } from "../../lib/graph";
import { Address } from "../Address";
import { Link } from "../Link";
import { actorHref } from "@/lib/routes";
import { facilityIndex, facilityValue, linkedFacility } from "@/lib/nfatFacilities";
import type { InstanceParam } from "@/lib/radarRules";

const ADDRESS_RE = /0x[0-9a-fA-F]{40}/;

/**
 * Under an instance whose params point at an NFAT Facility: the facility, the
 * Halo that runs it, and the contract address and NFAT the instance states only
 * by reference. Nothing for any other instance.
 */
export function InstanceFacility({ params }: { params: InstanceParam[] }) {
  const graph = useLoaded(loadGraph, { soft: true });
  const index = useMemo(() => facilityIndex(graph?.participants ?? []), [graph]);
  const ref = useMemo(() => linkedFacility(params.map((p) => p.value), index), [params, index]);
  if (!ref) return null;
  const { facility: f, halo } = ref;
  const address = facilityValue(f, "contract", "Contract Address")?.match(ADDRESS_RE)?.[0];
  const name = facilityValue(f, "contract", "/ name");
  const symbol = facilityValue(f, "contract", "/ symbol");
  return (
    <p className="mono text-[10px] mt-2 pt-2 leading-relaxed" style={{ color: "var(--tan-2)", borderTop: "1px solid var(--border)" }} data-slot="instance-facility">
      <span style={{ color: "var(--tan-3)" }}>NFAT Facility</span>{" "}
      <Link to={actorHref(halo.slug, `facility-${f.id}`)} className="text-accent hover:underline">{f.name}</Link>, run by {halo.name}
      {address && <> · contract <Address address={address} chain={[f.network ?? undefined]} /></>}
      {name && <> · NFAT {name}{symbol ? ` (${symbol})` : ""}</>}
    </p>
  );
}
