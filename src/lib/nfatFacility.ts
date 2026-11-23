// An NFAT Facility as a Halo Agent's graph entity states it (meta
// `nfat_facilities`, written by scripts/lib/graph-nfat-facilities.ts): the
// deal terms, the NFAT Facility Contract, and the Diamond PAU the Halo runs it
// through. Each group is a param map in the shape an instance card reads.
import type { ParamTuple } from "./rewardsTypes.ts";

export type NfatFacilityStatus = "Active" | "Completed";
export type NfatParams = Record<string, ParamTuple>;

export interface NfatFacility {
  /** UUID of the facility's own document. */
  id: string;
  name: string;
  doc_no: string;
  /** From the section it is listed under; null when the section names no status. */
  status: NfatFacilityStatus | null;
  /** The network section it is listed under, as the atlas titles it. */
  network: string | null;
  /** Listed in the Allocation System Primitive's Approved NFAT Facilities. */
  approved: boolean;
  /** Its "Parameters": asset, deal size, yield, term, eligible Primes, redemption. */
  terms: NfatParams;
  /** Its NFAT Facility Contract: address, NFAT name and symbol. */
  contract: NfatParams;
  /** Its Diamond PAU: contract addresses, facets, rate limits, growth rate. */
  pau: NfatParams;
  /** The multisigs its Diamond PAU names, by their documents' UUIDs (each is a multisig entity). */
  multisigs: { id: string; name: string }[];
}

/** A Halo Agent entity's parsed meta, as far as NFAT Facilities go. */
export interface HaloFacilitiesMeta {
  nfat_facilities?: NfatFacility[];
}

/** An NFAT Facility Contract's own state as the chain answers it; a read that failed is null, never false. */
export interface NfatFacilityState {
  /** The asset it takes subscriptions and repayments in (`gem()`). */
  gem: string | null;
  /** Where principal goes when an NFAT is issued (`recipient()`); the zero address until it is set. */
  recipient: string | null;
  /** Whether a freezer has stopped subscriptions, issuance, repayments and collection (`stopped()`). */
  stopped: boolean | null;
  /** Whether the deployment's ALM proxy may issue NFATs (`buds(almProxy)`); null without a listed proxy. */
  operator: boolean | null;
  /** The NFAT's own name and symbol. */
  name: string | null;
  symbol: string | null;
}
