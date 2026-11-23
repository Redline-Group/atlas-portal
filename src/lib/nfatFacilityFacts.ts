// What a deployment's NFAT Facility Contract answers about itself
// (ContractState.facility), as the short facts its card lists: each a label, a
// value, and the call behind it. A read that failed says so; nothing is
// inferred. Pure.
import type { PauSnapshot } from "./pau.ts";

export interface FacilityFact {
  label: string;
  value: string;
  /** The contract call the fact is read from. */
  why: string;
  /** The facility cannot run a deal in this state. */
  warn?: boolean;
}

const ZERO = "0x0000000000000000000000000000000000000000";
const UNREAD = "not read";

function recipient(snap: PauSnapshot, to: string | null): Pick<FacilityFact, "value" | "warn"> {
  if (to === null) return { value: UNREAD };
  if (to === ZERO) return { value: "not set yet", warn: true };
  const proxy = snap.contracts.find((c) => c.role === "almProxy")?.address.toLowerCase();
  return to === proxy ? { value: "this PAU's ALM proxy" } : { value: to, warn: true };
}

const yesNo = (v: boolean | null, yes: string, no: string) => (v === null ? UNREAD : v ? yes : no);

/** The facility's facts, or null when the deployment runs no NFAT Facility. */
export function nfatFacilityFacts(snap: PauSnapshot): FacilityFact[] | null {
  const f = snap.contracts.find((c) => c.role === "nfatFacility")?.facility;
  if (!f) return null;
  return [
    { label: "NFAT", value: f.name ? `${f.name}${f.symbol ? ` (${f.symbol})` : ""}` : UNREAD, why: "name() and symbol() of the NFAT Facility Contract" },
    { label: "principal goes to", ...recipient(snap, f.recipient), why: "recipient(): where issue() sends the principal it claims" },
    { label: "ALM proxy", value: yesNo(f.operator, "may issue NFATs", "may not issue NFATs yet"), warn: f.operator === false, why: "buds(ALM proxy): issue() is open only to the facility's operators" },
    { label: "status", value: yesNo(f.stopped, "stopped by a freezer", "running"), warn: f.stopped === true, why: "stopped(): a freezer's stop() halts subscribe, issue, repay and collect" },
  ];
}
