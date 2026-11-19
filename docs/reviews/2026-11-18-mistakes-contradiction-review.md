# Contradiction findings from the 2026-11-18 Potential Mistakes sweep

**Date:** 2026-11-18
**Corpus as reviewed:** `public/potential-mistakes.json` after the incremental sweep of 2026-11-18 (atlas SHA `6daa01968a0fc3fe67fdedc45761cf33ba114515`, 1,957 documents re-read, 360 findings, 5 of them new `contradiction` rows)
**Question:** which of the five new contradiction rows hold up when each flagged document is read beside the documents it was said to conflict with?
**Method:** the strict test the factual pass was given (from [2026-09-16-mistakes-contradiction-false-positives.md](2026-09-16-mistakes-contradiction-false-positives.md)): a contradiction is two texts asserting incompatible operative rules with no exception, override or present/future split between them. The Atlas text at the SHA above is ground truth; the sweep's `quote` / `issue` / `fix` are the claim under review.
**Who decided:** Claude (an AI assistant) read each row and proposed the verdicts below; a person approved the list as proposed without re-checking each row. The two Skybase/Keel rows in the addendum are a person's call. In `public/potential-mistakes.json`, each veto this review recorded carries `rejectedBy`: `human` for a person's call, `ai-review` otherwise, so the AI-decided vetoes can be audited and confirmed or reopened.

---

## Bottom line

**One is real, four are false positives** (the Skybase row was first kept as copy-paste residue; the correction is in the addendum).

| Finding | Sweep sev. | Verdict | Action |
|---|---|---|---|
| A.6.1.1.1.2.2.2.2.1.2.1.1 Spark Root Edit Proposal Submission | low | False positive — named exception exists | moved to `rejected` |
| A.6.1.1.1.3.2.1.1.2.1.18 pyUSD Risk Parameters | low | False positive — same shape as a sibling | moved to `rejected` |
| A.6.1.1.1.2.6.1.2.2.1.1.3 ALM Controller Role | low | False positive — general sentence beside a specific rule | moved to `rejected` |
| A.6.1.1.4.2.2.2.2.1.2.1.1 Skybase Root Edit Proposal Submission | low | False positive — named exception exists (see addendum) | moved to `rejected`, with the Keel row this review had added |
| A.2.2.10.1.1.1.2.2.7 Administered Agent Admin | low | Real | kept, raised to medium |

---

## Spark Root Edit Proposal Submission — false positive

Sweep id `A.6.1.1.1.2.2.2.2.1.2.1.1#contradiction` (`c9f7cc6e-0548-4599-9f9d-bfa1d2bb7577`). The sweep read "A SPK token holder must hold at least 1% of the total token supply" beside "Where the token-holding requirement applies, the post must include cryptographic proof…" as an unconditional rule followed by a conditional one with no stated condition.

The condition is stated, one level down. Root Edit Proposal Submission Requirements Exception For Nested Contributors · A.6.1.1.1.2.2.2.2.1.2.1.1.1:

> Nested Contributors are always authorized to submit Artifact Edit Proposals and do not have to fulfill the token-holding requirements defined in [A.6.1.1.1.2.2.2.2.1.2.1.1 - Root Edit Proposal Submission](c9f7cc6e-0548-4599-9f9d-bfa1d2bb7577).

General rule on the parent, named exception on the child: the first pattern in the 2026-09-16 review. Grove carries the same pair (A.6.1.1.2.2.2.2.2.1.2.1.1 and its exception A.6.1.1.2.2.2.2.2.1.2.1.1.1) and was correctly not flagged.

## pyUSD Risk Parameters — false positive

Sweep id `A.6.1.1.1.3.2.1.1.2.1.18#contradiction` (`5e05e5d8-8477-460f-a197-4b49bfa8652f`). The sweep's case: LTV 0% and Liquidation Threshold 0% beside `Collateral: Yes`, where USDG and RLUSD with the same 0%/0% are `Collateral: No`; and pyUSD omits the Flash Loan Enabled line.

Neither half separates pyUSD from its siblings under SparkLend Ethereum Risk Parameters (A.6.1.1.1.3.2.1.1.2.1):

- USDS Risk Parameters (A.6.1.1.1.3.2.1.1.2.1.3) is also LTV 0%, Liquidation Threshold 0%, `Collateral: Yes`. The Atlas pairs 0%/0% with both `Yes` (USDS, pyUSD) and `No` (USDT, USDC, USDG, RLUSD), so the text sets no rule that pyUSD breaks.
- cbBTC (A.6.1.1.1.3.2.1.1.2.1.16) and sUSDS (A.6.1.1.1.3.2.1.1.2.1.17) omit the Flash Loan Enabled line too.

Whether pyUSD is in fact usable as collateral is a question about the deployed SparkLend configuration that the risk parameters as written (A.6.1.1.1.3.2.1.1.2.1.18) cannot settle, and the sweep is told not to judge on-chain state.

## ALM Controller Role — false positive

Sweep id `A.6.1.1.1.2.6.1.2.2.1.1.3#contradiction` (`846e460d-db29-4ad0-82f7-5174fcb9b195`). The sweep's case: "ALM Controller contracts are accessed and modified via the Relayer Role" conflicts with `setMintRecipient` being callable only by `DEFAULT_ADMIN_ROLE` (A.6.1.1.1.2.6.1.2.2.1.2.1.1.1, A.6.1.1.1.2.6.1.2.2.1.2.2.1.1).

The role set is defined across siblings under Role Hierarchy And Permissions (A.6.1.1.1.2.6.1.2.2.1.1), and the admin side is stated there. Default Admin Role · A.6.1.1.1.2.6.1.2.2.1.1.1:

> The admin role (`DEFAULT_ADMIN_ROLE`) is the role that can grant and revoke any role, including itself and all other roles defined in the contract. The admin role is also used for general admin functions in all contracts.

Read together, the Controller Role sentence describes operational access, the Default Admin Role covers admin functions, and the function-level documents name the admin-only calls — a general sentence beside a specific rule. "Modified" is loose wording, and the same template sentence appears in the ALM Controller Role documents of Spark, Grove, Keel, Obex and Pattern (A.6.1.1.1.2.6.1.2.2.1.1.3, A.6.1.1.2.2.6.1.2.2.1.1.1.3, A.6.1.1.3.2.6.1.2.2.1.1.1.3, A.6.1.1.5.2.6.1.2.2.1.1.3, A.6.1.1.6.2.6.1.2.2.1.1.3), but it is not two incompatible operative rules.

## Skybase Root Edit Proposal Submission — false positive (superseded, see addendum)

Sweep id `A.6.1.1.4.2.2.2.2.1.2.1.1#contradiction` (`f57f157c-c260-4671-8150-01acabcd286d`). The wording is identical to Spark's, but here nothing gives the condition a meaning: no Nested Contributor exception exists anywhere under Skybase's artifact (A.6.1.1.4), unlike Spark (A.6.1.1.1.2.2.2.2.1.2.1.1.1) and Grove (A.6.1.1.2.2.2.2.2.1.2.1.1.1). The Primes without such an exception state the proof requirement unconditionally — Obex, Pattern, Osero and Launch Agent 7 (A.6.1.1.5.2.2.2.2.1.2.1.1, A.6.1.1.6.2.2.2.2.1.2.1.1, A.6.1.1.7.2.2.2.2.1.2.1.1, A.6.1.1.8.2.2.2.2.1.2.1.1) all read "The post must include cryptographic proof…".

So the defect is real, but it is residue of the Spark/Grove template rather than two rules in conflict: re-filed as `copy-paste`, severity medium (the conditional demonstrably refers to nothing). Keel's Root Edit Proposal Submission (A.6.1.1.3.2.2.2.2.1.2.1.1) carries the same residue with no exception under A.6.1.1.3, and the sweep did not flag it; a matching `copy-paste` row was added for it.

## Administered Agent Admin — real

Sweep id `A.2.2.10.1.1.1.2.2.7#contradiction` (`d823b872-fe99-4856-9096-55335357d55e`). The document says the Administered Agent Admin and the Default Admin Role are "both … held by Sky Governance through the Prime Agent's SubProxy". The Default Admin Role it links to says otherwise off Mainnet. Default Admin Role · A.2.2.10.1.1.1.2.2.1:

> It is held by Sky Governance through the Prime Agent's SubProxy on Ethereum Mainnet and through the Prime Agent's Executor on other networks.

The AdministeredAgent is deployed off Mainnet — Osero's is on Base (AdministeredAgent Contract, A.6.1.1.7.2.6.1.2.1.1.1.2.2.5), and Osero's Role Hierarchies And Permissions (A.6.1.1.7.2.6.1.2.2.1.1) gives the `DEFAULT_ADMIN_ROLE` to the Osero SubProxy on Ethereum Mainnet and to the Osero Executor on Base. "Both … through the Prime Agent's SubProxy" is therefore true only on Mainnet. Kept, severity raised from low to medium.

---

## Addendum (2026-11-19) — Skybase and Keel rows rejected

The Skybase section above is wrong. It looked only for a Nested Contributor exception and concluded the conditional "Where the token-holding requirement applies" refers to nothing. Skybase has a different exception, which waives the requirement for buyback and grant proposals. Root Edit Proposal Submission Requirements Exception · A.6.1.1.4.2.2.2.2.1.2.1.1.1:

> For proposals that solely entail a buyback or a grant of SKYBASE tokens, the requirement that SKYBASE token holders must hold at least 1% of the circulating token supply to submit a proposal is waived.

Keel carries the same waiver. Root Edit Proposal Submission Requirements Exception · A.6.1.1.3.2.2.2.2.1.2.1.1.1:

> For proposals that solely entail a buyback or a grant of KEEL tokens, the requirement that KEEL token holders must hold at least 1% of the circulating token supply to submit a proposal is waived.

So the conditional works in both, exactly as it does for Spark (A.6.1.1.1.2.2.2.2.1.2.1.1.1) and Grove (A.6.1.1.2.2.2.2.2.1.2.1.1.1), whose exception is for Nested Contributors. The suggested fix (state the proof requirement unconditionally) would contradict the waiver. Obex, Pattern, Osero and Launch Agent 7 have no exception at that slot and state the rule unconditionally (A.6.1.1.5.2.2.2.2.1.2.1.1, A.6.1.1.6.2.2.2.2.1.2.1.1, A.6.1.1.7.2.2.2.2.1.2.1.1, A.6.1.1.8.2.2.2.2.1.2.1.1); all eight Primes are consistent as they stand.

The Skybase row (`A.6.1.1.4.2.2.2.2.1.2.1.1#copy-paste`) and the Keel row this review added (`A.6.1.1.3.2.2.2.2.1.2.1.1#copy-paste`) are moved to `rejected`.

