import { wrap, type MscView } from "./msc-view-kit.ts";

// Atlas-vs-workbook vocabulary runs both ways: most terms are Soter coinages, but Sky Direct Exposure is Atlas-defined.
const TERMS = [
  {
    term: "Cost of funds",
    meaning:
      "The interest the Prime owes Sky on capital Sky minted to it. In these workbooks it is part of To Sky (sky revenue − Sky Direct Exposure), not a separate payout to add on top. NOT Atlas vocabulary — the Atlas calls the same thing \"an interest expense of the Prime Agent and revenue of Sky\" (A.2.4.2.1) and says it is charged on a utilized balance defined in A.2.4.2.1.2. The daily accrual and day-count used to compute it are Soter implementation choices; the Atlas specifies neither.",
  },
  {
    term: "Supply kept",
    meaning:
      "What the Prime keeps from the venue book after paying Sky: prime agent revenue minus cost of funds. Not the Comparison block's sum of per-venue Profit to Grove — that sum drops Spark's non-venue revenue and spread reimbursement. NOT Atlas vocabulary.",
  },
  {
    term: "Sky Direct Exposure",
    meaning:
      "An ATLAS-DEFINED term (A.2.2.10.1.1.1.1) — unlike the other words on this list. The Atlas excludes USDS attributable to a Sky Direct Exposure from the utilized balance interest is charged on (A.2.4.2.1.2), and excludes it from sUSDS netting (A.2.4.2.1.3). In these workbooks it is the remainder of Sky's take after cost of funds: material for Grove, near-zero for Spark, zero for Obex.",
  },
  {
    term: "Demand-side",
    meaning:
      "Agent rate plus distribution rewards, Chronicle points, and accessibility rewards (GAR) when present. Keel and Skybase settle as demand-side-only cycles. NOT Atlas vocabulary, and note the direction flips by party: Distribution Rewards are an EXPENSE of the Sky Protocol in the Atlas (A.2.3.1.2.1.3.3) and revenue to the Prime here.",
  },
  {
    term: "Net Revenue",
    meaning:
      "An Atlas term these workbooks do NOT compute. The Atlas defines Net Revenue as Income minus Expenses (A.2.3.1.2.1.1), recognised on a cash basis by when USDS/DAI enter or leave the Sky Surplus Buffer (A.2.3.1.2.1), then allocated through the waterfall in A.2.3.1.2. To Sky is part of one Income component (Stability Fees From Base Rate, A.2.3.1.2.1.2.1) before any Expenses — Sky Savings Rate paid to sUSDS holders (A.2.3.1.2.1.3.1) and the reward expenses are not deducted anywhere in these figures. Never present To Sky, or a sum of it, as Sky's net revenue.",
  },
];

function buildTerms(): Record<string, unknown> {
  return wrap(
    [{ kind: "soter_pipeline", note: "Redline Portal reading of soterlabs/settlement-cycle — not Atlas documents." }],
    { view: "terms", terms: TERMS },
  );
}

export const termsView = { name: "terms", build: buildTerms } as const satisfies MscView;
