// An NFAT Facility's plumbing: the money cycle between a subscribing Prime, the
// NFAT Facility Contract and the Diamond PAU the Halo runs it through. The
// numbers follow one deal: subscribe, issue, repay, collect. Each `rule` is the
// check in the NFATFacility, NFATPrimeFacet and NFATHaloFacet sources. The
// PAU's own wiring is the diamond diagram's (pauPlumbingDiamond.ts).
import { SHARED, type Plumbing } from "./pauPlumbingParts.ts";

export const NFAT_PLUMBING: Plumbing = {
  id: "pau-plumbing-nfat",
  w: 1160,
  h: 400,
  frameLabel: "NFAT Facility",
  ownNote: "the NFAT Facility Contract",
  frame: { x: 310, y: 122, w: 530, h: 262 },
  summary:
    "A Prime's ALM proxy subscribes funds into the NFAT Facility Contract's queue and can withdraw them until they are claimed. The Halo's controller issues an NFAT: the contract mints it to the Prime and sends the principal to the Halo's ALM proxy, which puts it to work in the underlying deal. The Halo repays principal and interest to the contract, and the Prime collects them against its NFAT. The Halo's admin names the contract's operators, recipient and freezers; a facility freezer can stop it.",
  nodes: [
    { id: "admin", name: "Admin", nick: "owner", lines: ["Halo's governance contract,", "run by executive spells."], x: 290, y: 16, w: 160 },
    // Its own node id: the facility's freezers (cops) are not the PAU's freezer multisig, an AdministeredAgent revoker.
    { id: "facilityFreezer", name: "Facility freezer", nick: "emergency stop", lines: ["Stops the facility. Sets", "nothing, moves nothing."], x: 470, y: 16, w: 160 },
    { id: "prime", name: "Prime's ALM proxy", nick: "subscriber", lines: ["Queues funds, holds the", "NFAT, collects repayments."], x: 20, y: 150, w: 160 },
    { id: "facility", name: "NFAT Facility Contract", nick: "queue and ledger", lines: ["Holds queued funds and", "repayments; mints NFATs."], x: 330, y: 150, w: 160, own: true },
    SHARED.almProxy({ x: 660, y: 150 }),
    { id: "venues", name: "Underlying deal", nick: "destination", lines: ["Where the Halo puts", "the principal to work."], x: 980, y: 150, w: 160 },
    { id: "primeController", name: "Prime's controller", nick: "NFAT Prime facet", lines: ["Subscribes, withdraws and", "collects, each rate limited."], x: 20, y: 296, w: 160 },
    { id: "controller", name: "Controller", nick: "NFAT Halo facet", lines: ["Issues and repays, each", "within a rate limit."], x: 660, y: 296, w: 160 },
    SHARED.relayer({ x: 980, y: 296 }),
  ],
  edges: [
    {
      from: "prime", to: "facility", kind: "flow", label: "① subscribes funds",
      rule: "NFATFacility.subscribe pulls the gem from its caller into that caller's queue; NFATPrimeFacet.subscribe is onlyRole(ALLOCATOR_ROLE) and draws down LIMIT_NFAT_PRIME_SUBSCRIBE", d: "M180 172 H324", lx: 252, ly: 163, align: "middle",
    },
    {
      from: "facility", to: "prime", kind: "flow", label: "② NFAT · ④ collects",
      rule: "NFATFacility.issue mints the NFAT to the subscriber; collect pays only the NFAT's owner; withdraw returns the caller's own unclaimed funds", d: "M330 204 H186", lx: 255, ly: 220, align: "middle",
    },
    {
      from: "facility", to: "almProxy", kind: "flow", label: "② principal on issue",
      rule: "NFATFacility.issue is open only to its operators (toll: buds) and sends the principal to its recipient", d: "M490 172 H654", lx: 572, ly: 163, align: "middle",
    },
    {
      from: "almProxy", to: "facility", kind: "flow", label: "③ repays principal, interest",
      rule: "NFATFacility.repay pulls the gem from its caller into the NFAT's collectable balance", d: "M660 204 H496", lx: 576, ly: 220, align: "middle",
    },
    { from: "almProxy", to: "venues", kind: "flow", label: "puts to work", rule: "the proxy is the account the deal sees", d: "M820 187 H974", lx: 897, ly: 178, align: "middle" },
    { from: "primeController", to: "prime", kind: "flow", label: "executes through", rule: "onlyRole(CONTROLLER) on the Prime's ALMProxy.doCall", d: "M100 296 V230", lx: 110, ly: 266 },
    { from: "controller", to: "almProxy", kind: "flow", grants: ["CONTROLLER on almProxy"], label: "executes through", rule: "onlyRole(CONTROLLER) on doCall", d: "M740 296 V230", lx: 750, ly: 266 },
    {
      from: "relayer", to: "controller", kind: "flow", label: "asks to issue or repay",
      rule: "the relayer calls through the AdministeredAgent, which holds ALLOCATOR_ROLE: NFATHaloFacet.issue, repayPrincipal and repayInterest are onlyRole(ALLOCATOR_ROLE); each draws down its rate limit, and interest is capped by the maximum annual growth rate", d: "M980 333 H826", lx: 903, ly: 324, align: "middle",
    },
    {
      from: "admin", to: "facility", kind: "rule", label: "names operators, recipient, freezers",
      rule: "auth (wards) on NFATFacility.rely / deny, kiss / diss, file, addFreezer / removeFreezer, start and the rescue functions", d: "M428 90 V144", lx: 420, ly: 112, align: "end",
    },
    { from: "facilityFreezer", to: "facility", kind: "stop", label: "stops it", rule: "NFATFacility.stop is open to its freezers (cops); only an admin starts it again", d: "M480 90 V144", lx: 490, ly: 112 },
  ],
};
