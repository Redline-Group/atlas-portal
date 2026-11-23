import type { ActorProfile } from "../../lib/actorIndex";
import { atlasHref } from "@/lib/routes";
import { runsFacilityPau } from "@/lib/radarPages";
import { AtlasLink } from "../AtlasLink";
import { Callout } from "../Callout";
import { ActorPageShell } from "./ActorPageShell";
import { ActorPau } from "./ActorPau";
import { SourceMarks } from "../SourceMark";

export interface ActorPauPageProps {
  profile: ActorProfile;
}

/** The atlas document defining the Allocation System Primitive (A.2.2.10.1), the primitive a Prime's Liquidity Layer Architecture belongs to. */
const ALLOCATION_SYSTEM_DOC = "9db14ab7-bb4b-4751-8084-843bd4359f2a";

/** What a Halo Agent's PAUs page covers: the Diamond PAU of each NFAT Facility it runs. */
function HaloIntro({ name }: { name: string }) {
  return (
    <Callout className="-mt-4 mb-6 max-w-[60rem]">
      {name} runs each of its NFAT Facilities through a Diamond PAU, a controller that dispatches to facets, as the{" "}
      <AtlasLink to={atlasHref(ALLOCATION_SYSTEM_DOC)} className="text-accent hover:underline">Allocation System Primitive</AtlasLink> sets out. This page lists that PAU&apos;s contracts, rate limits
      and on-chain parameters, with the NFAT Facility Contract it operates. The values are read from the chain by the atlas worker, from the contracts in our PAU registry; each deployment shows when it was
      read. <SourceMarks sources={["onchain", "curated"]} className="align-middle" />
    </Callout>
  );
}

/** The agent's Liquidity Layer Architecture as the chain reports it: each chain's controller deployments. */
export function ActorPauPage({ profile }: ActorPauPageProps) {
  if (runsFacilityPau(profile.entity)) {
    return (
      <ActorPageShell profile={profile} page="pau">
        <HaloIntro name={profile.entity.name} />
        <ActorPau prime={profile.entity} instances={profile.instances} />
      </ActorPageShell>
    );
  }
  return (
    <ActorPageShell profile={profile} page="pau">
      <Callout className="-mt-4 mb-6 max-w-[60rem]">
        Liquidity Layer Architecture is part of {profile.entity.name}&apos;s{" "}
        <AtlasLink to={atlasHref(ALLOCATION_SYSTEM_DOC)} className="text-accent hover:underline">Allocation System Primitive</AtlasLink>. It lists the contracts, rate limits and on-chain
        parameters of its controllers on each chain. On a chain, a Prime Agent runs a monolithic ALM Controller, a Diamond PAU (a controller that dispatches to facets), or both.
        The values under each deployment are read from the chain by the atlas worker, from the contracts in our PAU registry; each deployment shows when it was read.{" "}
        <SourceMarks sources={["onchain", "curated"]} className="align-middle" />
      </Callout>
      <ActorPau prime={profile.entity} instances={profile.instances} />
    </ActorPageShell>
  );
}
