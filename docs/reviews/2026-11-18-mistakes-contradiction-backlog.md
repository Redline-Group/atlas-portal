# Contradiction backlog review — the 32 pre-existing rows

**Date:** 2026-11-18
**Corpus as reviewed:** `public/potential-mistakes.json` after the 2026-11-18 incremental sweep and the review of its five new rows ([2026-11-18-mistakes-contradiction-review.md](2026-11-18-mistakes-contradiction-review.md)); atlas SHA `6daa01968a0fc3fe67fdedc45761cf33ba114515`. These 32 `contradiction` rows predate that sweep (13 sweep-severity high, 19 medium).
**Question:** which of them hold up when each flagged document is read beside the documents it was said to conflict with?
**Method:** the strict test from [2026-09-16-mistakes-contradiction-false-positives.md](2026-09-16-mistakes-contradiction-false-positives.md) — a contradiction is two texts asserting incompatible operative rules with no exception, override or present/future split between them. Each row was read against the atlas at the SHA above; every quote below was checked mechanically as a verbatim substring of the document it is attributed to. Rows that are real defects but not contradictions were re-filed under the category that fits.
**Who decided:** AI reviewers (Claude subagents) read each row and gave the verdicts; Claude checked every cited quote mechanically and made the review calls listed below. No person re-checked the rows. In `public/potential-mistakes.json`, each veto this review recorded carries `rejectedBy`: `human` for a person's call, `ai-review` otherwise, so the AI-decided vetoes can be audited and confirmed or reopened.

---

## Bottom line

**12 real, 13 real but re-filed, 6 false positives, 1 fixed upstream.** Three further rows were added for Primes the sweep missed (see the Upkeep Rebate note).

| # | Finding | Sweep sev. | Verdict | Action |
|---|---|---|---|---|
| 1 | A.1.2.2.2.25 The Navigation Hub Type | high | Real | kept (medium) |
| 2 | A.1.10.2.4.11.2.3 Governance Point Merges The Updated Active Executive File | high | Real, re-filed | re-filed as `wrong-word` (high) |
| 3 | A.1.10.2.4.12.4.2 Spell Failing Validation | high | Real | kept (medium) |
| 4 | A.1.11.2.3 Rejecting A Proposal For Misalignment | high | Real | kept (high) |
| 5 | A.2.2.6.2.1.1.2 Validation | high | Real | kept (high) |
| 6 | A.3.3.2.3.1 Demand Absorption Buffer | high | Real | kept (high) |
| 7 | A.3.5.2.2.1.2 Kicker Lot Size Parameter | high | Real, re-filed | re-filed as `wrong-word` (high) |
| 8 | A.4.4.1.3.8.5.1 Initial Parameter Values Set In Executive Vote | high | Fixed upstream | moved to `rejected` |
| 9 | A.6.1.1.2.2.6.1.3.1.4.4.2.3 Rate Limit IDs | high | Real, re-filed | re-filed as `stale` (high) |
| 10 | A.6.1.1.3.2.6.1.2.1.1.3.2.2.2 USDC For USDS Swap Maximum | high | Real, re-filed | re-filed as `wrong-word` (high) |
| 11 | A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.3.2.1 withdrawERC4626 Function | high | Real, re-filed | re-filed as `copy-paste` (high) |
| 12 | A.6.1.1.5.2.6.1.2.2.1.2.1.2.3.2.1 withdrawERC4626 Function | high | Real, re-filed | re-filed as `copy-paste` (high) |
| 13 | A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.2.1 withdrawERC4626 Function | high | Real, re-filed | re-filed as `copy-paste` (high) |
| 14 | A.1.2.2.1.3 Supporting Document Category | medium | False positive | moved to `rejected` |
| 15 | A.1.6.10 Emergency Contact Mechanism | medium | False positive | moved to `rejected` |
| 16 | A.1.10.2.4.8.2.6 Best Practices | medium | False positive | moved to `rejected` |
| 17 | A.1.10.2.4.12.3.2.1 Spell Validators Must Check Deployed Spell License | medium | Real, re-filed | re-filed as `wrong-word` (medium) |
| 18 | A.1.10.2.4.12.3.2.2 Spell Validators Must Check Compiler Version | medium | Real, re-filed | re-filed as `wrong-word` (medium) |
| 19 | A.2.2.1.2.4.1.2 “Pre Root Edit Primitive” Stage | medium | Real, re-filed | re-filed as `stale` (low) |
| 20 | A.2.2.5.4.1.1.3 Official Update Of Artifact | medium | False positive | moved to `rejected` |
| 21 | A.2.2.9.1.2.4.1.1 Process Definition For Reward Calculation By Operational Govops | medium | Real, re-filed | re-filed as `stale` (medium) |
| 22 | A.2.2.9.2.2.1.2.3 Data Submission Frequency | medium | Real | kept (medium) |
| 23 | A.2.2.10.1.1.1.2.5.2.5.3.3 Swap Tokens Through Uniswap v3 Pool | medium | False positive | moved to `rejected` |
| 24 | A.2.8.1.1.1.2 Role Of Core Facilitator | medium | False positive | moved to `rejected` |
| 25 | A.2.8.2.2 Prime Program | medium | Real, re-filed | re-filed as `entity` (medium) |
| 26 | A.2.8.2.2.2.2.4 Minimum Borrowing Threshold for Grant Eligibility | medium | Real | kept (medium) |
| 27 | A.6.1.1.2.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate | medium | Real | kept (medium) |
| 28 | A.6.1.1.3.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate | medium | Real | kept (medium) |
| 29 | A.6.1.1.3.3.2 Use Of Idle Funds | medium | Real, re-filed | re-filed as `stale` (medium) |
| 30 | A.6.1.1.4.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate | medium | Real | kept (medium) |
| 31 | A.6.1.1.5.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate | medium | Real | kept (medium) |
| 32 | A.6.1.1.8.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate | medium | Real | kept (medium) |

**Upkeep Rebate (rows 27, 28, 30–32).** The same templated step sits in all eight Prime artifacts. Spark, Pattern and Osero (A.6.1.1.1.2.3.2.2.1.2.1.3, A.6.1.1.6.2.3.2.2.1.2.1.3, A.6.1.1.7.2.3.2.2.1.2.1.3) carry the identical mismatch and were not flagged; a matching `contradiction` row was added for each.

**Quote drift that is not a fix.** Row 28 read as "Quote no longer in doc" only because upstream turned `Keel's` into `Keel’s` and dropped a trailing period; `src/lib/mistakeQuote.ts` now treats curly and straight quotes alike and ignores a fragment's trailing punctuation. Row 19's quote predates an upstream rename of the stage it names ("Pre Transformation" → "Pre Transformation Primitive"); its quote was updated to the current wording because the defect itself stands.

---

## 1. A.1.2.2.2.25 The Navigation Hub Type — real

Sweep id `A.1.2.2.2.25#contradiction` (`fe9164c5-423c-41e8-b8a8-34f8a5d8d6b7`), sweep severity high. A.1.2.2.2.25 requires Navigation Hubs at the .0.0 position of an Immutable or Primary Document; A.1.2.2.2.21 requires Definition Directories 'always' at the .0.0 position of their Target Document. A Primary Document that needs both cannot satisfy both rules, and neither spec carries an exception or ordering. The clash carries down to the children: A.1.2.2.2.26 puts Focus Hubs at x.0.0.1, while A.1.2.2.2.22 puts Definitions under the Definition Directory, which is the same x.0.0.N space. No document currently sits at a .0.0 position, so the collision is latent, which is why this is medium rather than high.

The Navigation Hub Type · A.1.2.2.2.25:

> Navigation Hub Documents must be located at the .0.0 position of an Immutable or Primary Document.

The Definition Directory Type · A.1.2.2.2.21:

> Definition Directory Documents must always be located at the .0.0 position of their Target Document.

The Focus Hub Type · A.1.2.2.2.26:

> Focus Hub Documents must be located at the nonzero numerical positions below Navigation Hubs, e.g.: x.0.0.1, x.0.0.2, etc.

**Action:** kept (medium).

## 2. A.1.10.2.4.11.2.3 Governance Point Merges The Updated Active Executive File — real, re-filed

Sweep id `A.1.10.2.4.11.2.3#contradiction` (`77583ed9-933e-477b-85be-1458e83586d3`), sweep severity high. Every other reference to the executive-votes repository names the main branch: A.1.10.2.4.8.5.2 (Executive Document merge), A.1.10.2.4.11.1.5 (Governance Point merge), and the proposals.json link in A.1.10.2.4.11.2.1 that this same step is merging. A.1.10.2.4.11.2.3 alone says 'master'. That is a branch-name slip in one step, not two competing operative rules, so wrong-word fits better than contradiction. The fix is to change 'master' to 'main'.

Governance Point Merges The Updated Active Executive File · A.1.10.2.4.11.2.3:

> the Governance Point must merge it into the master branch of the executive-votes GitHub repository

Governance Point Merges Pull Request · A.1.10.2.4.11.1.5:

> the Governance Point must merge it into the main branch of the executive-votes GitHub repository

Governance Point Updates Active Executives File · A.1.10.2.4.11.2.1:

> https://github.com/sky-ecosystem/executive-votes/blob/main/active/proposals.json

**Action:** re-filed as `wrong-word` (high).

## 3. A.1.10.2.4.12.4.2 Spell Failing Validation — real

Sweep id `A.1.10.2.4.12.4.2#contradiction` (`66a80a93-fcfa-48d5-819e-99489288fa83`), sweep severity high. A.1.10.2.4.12.4.1 passes a Spell when all reported issues are resolved to the validator's satisfaction. A.1.10.2.4.12.4.2 fails a Spell when one or more issues are identified, without requiring that they stay unresolved. Its criterion 2 (issues remain unresolved) would be redundant if criterion 1 meant that. The parent A.1.10.2.4.12.4 shows the intent (resolve issues before the Spell can pass), but it does not change the overlapping definitions. Fail criterion 1 should require the issues to be unresolved, or be dropped.

Spell Failing Validation · A.1.10.2.4.12.4.2:

> 1. One or more issues are identified during validation, or

Spell Passing Validation · A.1.10.2.4.12.4.1:

> 2. All reported issues have been resolved to the satisfaction of the Spell validator

Validation Outcome Reporting · A.1.10.2.4.12.4:

> ensuring that all issues are resolved before the Spell can be classified as passing validation

**Action:** kept (medium).

## 4. A.1.11.2.3 Rejecting A Proposal For Misalignment — real

Sweep id `A.1.11.2.3#contradiction` (`94856ced-5c37-42e0-a756-0fa2ccd73180`), sweep severity high. A.1.11.2.3 says the triggering Ranked Delegate 'loses their AD buffer' when the Core Facilitator rejects the proposal for misalignment. The Action Tenet A.1.11.2.1.3.0.4.2 describes staking 'a portion' of the buffer and says a rejection for misalignment costs an amount equal to the Triggering Threshold. Its Scenario A.1.11.2.1.3.0.4.2.1.1 repeats that amount. Same event, two different penalties, and no exception or override links them. The Triggering Threshold is defined in A.1.6.4.4.2.1.1 as one month of Level 3 compensation, not the whole buffer.

Rejecting A Proposal For Misalignment · A.1.11.2.3:

> If the Facilitator rejects an Atlas Edit Weekly Cycle Proposal for misalignment, the Ranked Delegate who triggered the poll loses their AD buffer.

Ranked Delegates Must Stake Their AD Buffer To Trigger Weekly Cycle Proposals · A.1.11.2.1.3.0.4.2:

> If the Proposal is voted down or rejected for misalignment, the RD will lose an amount of USDS from their AD Buffer equal to the Triggering Threshold.

Delay In Payment To Ranked Delegate Triggering Proposal · A.1.11.2.1.3.0.4.2.1.1:

> if the Proposal is rejected by the Core Facilitator for misalignment or voted down by Sky Governance, the triggering AD loses an amount of USDS from their AD Buffer equal to the Triggering Threshold

**Action:** kept (high).

## 5. A.2.2.6.2.1.1.2 Validation — real

Sweep id `A.2.2.6.2.1.1.2#contradiction` (`2a466974-af55-4d3f-84a5-7ac840ffb620`), sweep severity high. The Root Edit setup process in A.2.2.6.2.1.1.2 names Core GovOps as validator. The lifecycle step A.2.2.1.1.15 names Operational GovOps for the same act. A.2.2.1.1.13 and A.2.2.6.1.1.1.4 say Core GovOps stops validating Primitive inputs once the Executor Accord Primitive is invoked. The Executor Accord comes before Root Edit (A.2.2.1.1.12 then .14), and A.2.2.6.2 has Root Edit directing the Operational Executor named in the Executor Accord. No exception reconciles the two validators.

Validation · A.2.2.6.2.1.1.2:

> Core GovOps validates the Agent’s inputs.

Operational GovOps Validates Root Edit Primitive Inputs · A.2.2.1.1.15:

> Operational GovOps reviews the inputs to the Root Edit Primitive

Operational GovOps Takes Over Operational Duties · A.2.2.6.1.1.1.4:

> Core GovOps will no longer perform validation of the Agent’s Primitive inputs

**Action:** kept (high).

## 6. A.3.3.2.3.1 Demand Absorption Buffer — real

Sweep id `A.3.3.2.3.1#contradiction` (`104c90df-9236-41bc-a6ee-a6db3e8ef097`), sweep severity high. A.3.3.1.1 defines Actively Stabilizing Collateral as 'non-USDS assets' used to buy USDS. A.3.3.2.2.1 makes ASC exactly Resting plus Latent ASC, and A.3.3.2.2.1.1.1 and A.3.3.2.2.1.2 list only USDC and other Cash Stablecoins. A.3.3.2.3.1 then calls the DAB, which consists of USDS for sale, a subset of ASC. The two definitions cannot both hold, and nothing in the subtree reconciles them. A.3.3.2.3 sizes the DAB as 25% of required ASC, which reads as a separate buffer sized against ASC, not a part of it.

Demand Absorption Buffer · A.3.3.2.3.1:

> a subset of ASC consisting of USDS that is for sale for at most 1.001 USD per USDS

Minimum Actively Stabilizing Collateral · A.3.3.1.1:

> highly liquid market making non-USDS assets that trade for close to 1 USD per USDS

Actively Stabilizing Collateral · A.3.3.2.2.1:

> Actively Stabilizing Collateral is the sum of (1) Resting Actively Stabilizing Collateral and (2) Latent Actively Stabilizing Collateral.

**Action:** kept (high).

## 7. A.3.5.2.2.1.2 Kicker Lot Size Parameter — real, re-filed

Sweep id `A.3.5.2.2.1.2#contradiction` (`fc9cece1-84bf-4133-a2ef-ef2182a23a35`), sweep severity high. A.3.5.2.2.1.1 defines `khump` as the minimum Surplus Buffer for transfers to the Splitter. A.3.5.2.2 says transfers can happen even when the buffer is negative, as long as it is above that signed threshold. A.3.5.2.2.1.2 writes the condition as 'greater than `kbump`', naming the lot-size parameter instead of the threshold. This is one parameter name swapped for its sibling's, so wrong-word fits better than contradiction. The fix is `khump`.

Kicker Lot Size Parameter · A.3.5.2.2.1.2:

> when the Surplus Buffer is greater than `kbump`

Kicker Threshold Parameter · A.3.5.2.2.1.1:

> The `khump` parameter is the minimum value of the Surplus Buffer for funds to be transferred from the Surplus Buffer to the Splitter contract.

Kicker Module · A.3.5.2.2:

> even when the Surplus Buffer is negative, as long as the Surplus Buffer is above the specified threshold

**Action:** re-filed as `wrong-word` (high).

## 8. A.4.4.1.3.8.5.1 Initial Parameter Values Set In Executive Vote — fixed upstream

Sweep id `A.4.4.1.3.8.5.1#contradiction` (`13c51e11-8ea3-4d4e-b631-2e99c559a914`), sweep severity high. A.4.4.1.3.8.5.1 still lists the initial `str` as 0 basis points. The document the finding set against it, Initial Supply Rate A.4.4.1.3.8.6.1.1 (uuid c4523493-97ba-4f57-ae2f-d407ab6e0f98), no longer exists, either by doc_no or by UUID. A search of A.4.4 finds no other text giving an initial `str` of about 40% or 4,000 bps. The two competing initial values no longer both appear, so the defect is gone.

Initial Parameter Values Set In Executive Vote · A.4.4.1.3.8.5.1:

> - `str` - 0 basis points

**Action:** moved to `rejected`.

## 9. A.6.1.1.2.2.6.1.3.1.4.4.2.3 Rate Limit IDs — real, re-filed

Sweep id `A.6.1.1.2.2.6.1.3.1.4.4.2.3#contradiction` (`3af5241e-5b72-4466-9e69-dccb8a8d203b`), sweep severity high. The parent body is the pre-population placeholder; children A.6.1.1.2.2.6.1.3.1.4.4.2.3.1 and .3.2 now give the concrete inflow and outflow IDs. Populated siblings such as A.6.1.1.2.2.6.1.3.1.4.3.2.3 switched to 'are defined in the subdocuments herein'; this one was not updated. No operative rule conflicts. The parent text is stale and should take the sibling wording. Several other Grove instances (e.g. A.6.1.1.2.2.6.1.3.1.1.1.2.3) still carry the placeholder, but whether each has children needs its own check.

Rate Limit IDs · A.6.1.1.2.2.6.1.3.1.4.4.2.3:

> will be specified in a future iteration of the Grove Artifact.

Inflow RateLimitID · A.6.1.1.2.2.6.1.3.1.4.4.2.3.1:

> The inflow RateLimitID is: `0x098ad67dc41c1a5892ec3ef5fd411198dc11962475e9ef2e0362e6cb7f5a2174`.

Rate Limit IDs · A.6.1.1.2.2.6.1.3.1.4.3.2.3:

> inflow and outflow are defined in the subdocuments herein.

**Action:** re-filed as `stale` (high).

## 10. A.6.1.1.3.2.6.1.2.1.1.3.2.2.2 USDC For USDS Swap Maximum — real, re-filed

Sweep id `A.6.1.1.3.2.6.1.2.1.1.3.2.2.2#contradiction` (`06081a43-075d-48c1-a26d-6578c1aa2fd3`), sweep severity high. The title and siblings A.6.1.1.3.2.6.1.2.1.1.3.2.2.3 (USDT), .2.4 (USDG) and .2.5 (PYUSD) all follow the pattern 'USDC that can be swapped for <destination>'. Here the destination is written as USDC, which is self-referential and plainly a typo for USDS. The parameters are unaffected. It is a wrong-word defect inside one document, not two incompatible operative rules.

USDC For USDS Swap Maximum · A.6.1.1.3.2.6.1.2.1.1.3.2.2.2:

> The maximum amount of USDC that can be swapped for USDC by the Keel Liquidity Layer on Solana

USDC For USDS Swap Maximum · A.6.1.1.3.2.6.1.2.1.1.3.2.2.2:

> USDC For USDS Swap Maximum

USDC For USDT Swap Maximum · A.6.1.1.3.2.6.1.2.1.1.3.2.2.3:

> The maximum amount of USDC that can be swapped for USDT by the Keel Liquidity Layer on Solana

**Action:** re-filed as `wrong-word` (high).

## 11. A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.3.2.1 withdrawERC4626 Function — real, re-filed

Sweep id `A.6.1.1.3.2.6.1.2.2.1.2.1.2.3.2.1#contradiction` (`37c09b7c-6aa0-4c3c-861e-984de4e3ba4d`), sweep severity high. In the renumbered doc A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.3.2.1, the precondition sentence matches the depositERC4626 sibling A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.3.1.1 word for word except 'deposit' -> 'withdrawal'. The same document's steps say the withdrawal burns vault shares held by the ALM Proxy and that withdrawn assets go to the Proxy. So holding the underlying beforehand is not the condition the steps describe. The redeemERC4626 sibling (.3.3.1) states its condition in shares. This is copy-paste residue in one document, not two conflicting governance rules.

withdrawERC4626 Function · A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.3.2.1:

> The operation will only succeed if the ALM Proxy holds at least the amount of the underlying asset specified for withdrawal; otherwise, the transaction will revert.

withdrawERC4626 Function · A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.3.2.1:

> burning the necessary number of vault shares held by the ALM Proxy as part of the withdrawal process.

depositERC4626 Function · A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.3.1.1:

> The operation will only succeed if the ALM Proxy holds at least the amount of the underlying asset specified for deposit; otherwise, the transaction will revert.

**Action:** re-filed as `copy-paste` (high).

## 12. A.6.1.1.5.2.6.1.2.2.1.2.1.2.3.2.1 withdrawERC4626 Function — real, re-filed

Sweep id `A.6.1.1.5.2.6.1.2.2.1.2.1.2.3.2.1#contradiction` (`d545d2f1-5973-4a93-889c-9d558ff79be7`), sweep severity high. The withdrawERC4626 document A.6.1.1.5.2.6.1.2.2.1.2.1.2.3.2.1 repeats the precondition from the depositERC4626 sibling A.6.1.1.5.2.6.1.2.2.1.2.1.2.3.1.1 with 'deposit' swapped for 'withdrawal'. Its own action list says the vault shares burned are those held by the ALM Proxy and the withdrawn assets are sent to the Proxy. The redeemERC4626 sibling (.3.3.1) conditions on the Proxy holding enough shares. The precondition should be stated in shares. The defect is copy-paste residue, not a clash between two operative rules.

withdrawERC4626 Function · A.6.1.1.5.2.6.1.2.2.1.2.1.2.3.2.1:

> The operation will only succeed if the ALM Proxy holds at least the amount of the underlying asset specified for withdrawal; otherwise, the transaction will revert.

withdrawERC4626 Function · A.6.1.1.5.2.6.1.2.2.1.2.1.2.3.2.1:

> The withdrawn assets will be sent to the ALM Proxy.

redeemERC4626 Function · A.6.1.1.5.2.6.1.2.2.1.2.1.2.3.3.1:

> The operation will only succeed if the ALM Proxy holds at least the number of shares specified for redemption; otherwise, the transaction will revert.

**Action:** re-filed as `copy-paste` (high).

## 13. A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.2.1 withdrawERC4626 Function — real, re-filed

Sweep id `A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.2.1#contradiction` (`40875283-48ec-48f0-8b61-e45d33f976ab`), sweep severity high. A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.2.1 has the same precondition sentence as the depositERC4626 sibling A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.1.1, with 'deposit' changed to 'withdrawal'. The document's own action list describes burning vault shares held by the ALM Proxy. The redeemERC4626 sibling A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.3.1 correctly conditions on shares. The text is internally inconsistent through copy-paste, not two conflicting operative rules.

withdrawERC4626 Function · A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.2.1:

> The operation will only succeed if the ALM Proxy holds at least the amount of the underlying asset specified for withdrawal; otherwise, the transaction will revert.

withdrawERC4626 Function · A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.2.1:

> burning the necessary number of vault shares held by the ALM Proxy as part of the withdrawal process.

depositERC4626 Function · A.6.1.1.6.2.6.1.2.2.1.2.1.2.3.1.1:

> The operation will only succeed if the ALM Proxy holds at least the amount of the underlying asset specified for deposit; otherwise, the transaction will revert.

**Action:** re-filed as `copy-paste` (high).

## 14. A.1.2.2.1.3 Supporting Document Category — false positive

Sweep id `A.1.2.2.1.3#contradiction` (`e87b6850-3792-495d-9460-0ac069a217e6`), sweep severity medium. A.1.2.2.1.3 and A.1.2.1.1 state the general identifier conventions (a 0 in Supporting Document identifiers, a leading capital A). The Needed Research Type Specification A.1.2.2.2.30 names itself as an exception. It is not derived from the Supporting Root, which is where the 0 comes from, and it explicitly prescribes the 'NR-' prefix. That is lex specialis: the specific type rule, which flags itself as different, governs its own documents. The general rules could cross-reference the exception, but the two texts do not assert incompatible operative rules without an override.

Supporting Document Category · A.1.2.2.1.3:

> Supporting Documents always have Document Identifiers that contain at least one 0.

The Needed Research Type · A.1.2.2.2.30:

> Unlike other Supporting Documents, the document identifier of Needed Research documents is not derived from the Supporting Root of their Target Document.

The Needed Research Type · A.1.2.2.2.30:

> Needed Research Document Identifiers begin with the prefix "NR-", followed by an incremented number.

**Action:** moved to `rejected`.

## 15. A.1.6.10 Emergency Contact Mechanism — false positive

Sweep id `A.1.6.10#contradiction` (`d5d4cc4a-8877-4931-861f-056793387b92`), sweep severity medium. A.1.6.6.1 sorts AD breaches into two tiers, and Tier 1 (A.1.6.6.1.1) covers administrative failures 'that do not reflect on' integrity. A.1.6.10 concerns the emergency contact mechanism for Executive Vote emergencies and says the high opsec requirements extend to its use. Tier 2 (A.1.6.6.1.2) item 5 already makes opsec violations that compromise governance security a derecognition offence. A.1.6.10 is therefore a subject-specific rule consistent with the Tier 2 outcome, the same shape as the A.1.6.8 opsec lex specialis the 2026-09-16 review rejected, rather than an incompatible second regime. Pointing A.1.6.10 at A.1.6.6.1.2 would make the link explicit, but that is a drafting nicety.

Emergency Contact Mechanism · A.1.6.10:

> ADs that fail to do so will be considered in misalignment and will be derecognized.

Emergency Contact Mechanism · A.1.6.10:

> The high operational security requirements applicable to ADs extend to their use of the emergency contact mechanism.

Tier 2 (Integrity) Breaches · A.1.6.6.1.2:

> Operational security violations that compromise governance security

**Action:** moved to `rejected`.

## 16. A.1.10.2.4.8.2.6 Best Practices — false positive

Sweep id `A.1.10.2.4.8.2.6#contradiction` (`3de17a79-145a-4ec5-b43d-d8c371ee598e`), sweep severity medium. A.1.10.2.4.8.2.6 is formatting guidance for the Executive Document, saying what an Authorization link 'may lead to'. It does not set the provenance standard. A.1.10.2.4.5.1.1 rules out informal, editable stakeholder comments as authorization. A.1.10.2.4.5.1.5 says provenance comments authorize 'using the authority provided to the commenting party by the Atlas'. Specific processes such as A.1.10.2.3.2.1.2.1.3 (the Core Facilitator approves by forum reply) and A.1.10.2.4.1.2.2 (Atlas-required Forum announcements) are the named cases where a Forum Post carries Atlas-conferred authority. That is lex specialis plus a descriptive best-practice note, not two incompatible operative rules, though the 'forum posts' example in A.1.10.2.4.5.1.1 is broader than its rationale.

Best Practices · A.1.10.2.4.8.2.6:

> The "Authorization" link may lead to an Atlas document, a Governance Poll or a Forum Post

Provenance URLs · A.1.10.2.4.5.1.5:

> authorize the execution of executive actions using the authority provided to the commenting party by the Atlas

Core Facilitator Approve Inclusion In Executive Vote · A.1.10.2.3.2.1.2.1.3:

> The Core Facilitator should post a reply to the Technical Scope Forum post and approve its inclusion in the next Executive Vote.

**Action:** moved to `rejected`.

## 17. A.1.10.2.4.12.3.2.1 Spell Validators Must Check Deployed Spell License — real, re-filed

Sweep id `A.1.10.2.4.12.3.2.1#contradiction` (`fb60b182-3ac9-4593-b9c7-8e1eaaeaa099`), sweep severity medium. A.1.10.2.4.12.3 defines Recommended Checks as 'not mandatory', A.1.10.2.4.12.3.2 says validators are 'encouraged', and the body of A.1.10.2.4.12.3.2.1 says the license check is 'not considered a strict requirement'. Every operative text agrees; only the title says 'Must', reusing the 'Spell Validators Must ...' title pattern of the Required siblings under A.1.10.2.4.12.3.1. That is a title wording slip, not two incompatible operative rules.

Spell Validators Must Check Deployed Spell License · A.1.10.2.4.12.3.2.1:

> Spell Validators Must Check Deployed Spell License

Spell Validators Must Check Deployed Spell License · A.1.10.2.4.12.3.2.1:

> While the Spell should use the correct license to pass validation, this is not considered a strict requirement.

Spell Validation Checks · A.1.10.2.4.12.3:

> Recommended Checks: Should be completed to ensure best practices, but are not mandatory.

**Action:** re-filed as `wrong-word` (medium).

## 18. A.1.10.2.4.12.3.2.2 Spell Validators Must Check Compiler Version — real, re-filed

Sweep id `A.1.10.2.4.12.3.2.2#contradiction` (`83f53a73-7e2f-4dc9-a371-e19238924bf3`), sweep severity medium. A.1.10.2.4.12.3 says Recommended Checks are 'not mandatory'; the body of A.1.10.2.4.12.3.2.2 says the compiler-version match is 'not considered a strict requirement'. The title alone carries 'Must', copied from the Required-check title pattern in A.1.10.2.4.12.3.1.x. The operative rule is unambiguous, so this is a wrong word in the title rather than a contradiction.

Spell Validators Must Check Compiler Version · A.1.10.2.4.12.3.2.2:

> Spell Validators Must Check Compiler Version

Spell Validators Must Check Compiler Version · A.1.10.2.4.12.3.2.2:

> While the Spell should use the correct version to pass validation, this is not considered a strict requirement.

Spell Validation Checks · A.1.10.2.4.12.3:

> Recommended Checks: Should be completed to ensure best practices, but are not mandatory.

**Action:** re-filed as `wrong-word` (medium).

## 19. A.2.2.1.2.4.1.2 “Pre Root Edit Primitive” Stage — real, re-filed

Sweep id `A.2.2.1.2.4.1.2#contradiction` (`7b25b220-92f9-4936-8296-31c0f3d8ddbc`), sweep severity medium. A.2.2.5.2.1.1.3 makes the Prime Transformation Invoked only after validation, and A.2.2.5.2.1.1.2 (and A.2.2.5.1.1.1.2 for Agent Creation) validation requires Agent Token, Executor Accord and Root Edit already Activated. So by the Pre Root Edit stage those Primitives are always Activated, and the 'Activate and Invoke ... assuming that these Primitives were not already Globally Activated' path in A.2.2.1.2.4.1.2 can never trigger. Because the clause is expressly conditional, both texts can be satisfied at once, so it is a vestigial sequencing branch rather than two incompatible rules; it still misleads readers (as does A.2.2.1.1.3.2's 'can only Activate and Invoke specific Primitives').

“Pre Root Edit Primitive” Stage · A.2.2.1.2.4.1.2:

> the Agent must Activate and Invoke (1) the Agent Token Primitive, then (2) the Executor Accord Primitive, and finally (3) the Root Edit Primitive, in that order

Validation · A.2.2.5.2.1.1.2:

> The necessary Primitives are the Agent Creation, Prime/Executor Transformation, Agent Token, Executor Accord, Root Edit, and Ecosystem Upkeep Fee Primitives.

Official Update Of Artifact · A.2.2.5.2.1.1.3:

> After successful validation, the Prime Transformation Primitive is considered successfully Invoked

**Action:** re-filed as `stale` (low).

## 20. A.2.2.5.4.1.1.3 Official Update Of Artifact — false positive

Sweep id `A.2.2.5.4.1.1.3#contradiction` (`309e17ed-c75a-48f5-859f-70a5cb29a1f8`), sweep severity medium. A.2.2.1.3.2.1 defines `Active` as an Instance that is 'fully operational and may be used for its intended purpose', with a deployed token-bridge as its example; a live Agent Token fits that. A.2.2.1.3.2.3's `Completed` case 2 overlaps, but the specific Agent Token setup doc A.2.2.5.4.1.1.3 picks `Active`, and the Agent Artifacts consistently file the token Instance under Active Instances (e.g. A.6.1.1.1.2.1.4.2). A.2.2.1.2.4.2.1.1 speaks of 'Global Status', not instance status, so it does not conflict. The two definitions overlap; the named case picks one.

Official Update Of Artifact · A.2.2.5.4.1.1.3:

> The Agent Artifact is officially upgraded to reflect an Agent Token Primitive Instance, with a Status of `Active`.

Active Instance Status · A.2.2.1.3.2.1:

> indicates that an instance of a Primitive is fully operational and may be used for its intended purpose by the Agent and potentially other parties

Prohibition On Deactivating Genesis Primitives · A.2.2.1.2.4.2.1.1:

> thereafter their Global Status is `Completed` and cannot be altered

**Action:** moved to `rejected`.

## 21. A.2.2.9.1.2.4.1.1 Process Definition For Reward Calculation By Operational Govops — real, re-filed

Sweep id `A.2.2.9.1.2.4.1.1#contradiction` (`27229032-ddb6-41a5-a5d5-6168ccc3142f`), sweep severity medium. A grep finds 'Prime Agent Management Fee' and 'Fees for Rewarded USDS Balances' only in A.2.2.9.1.2.4.1.1 itself. The operative formula in A.2.2.9.1.2.1.3.2 (average balance x annual rate / 12) and the child Process Flow A.2.2.9.1.2.4.1.1.2 contain no such fees. No other text asserts a competing rule, so this is a stale description of an older reward design rather than a contradiction.

Process Definition For Reward Calculation By Operational Govops · A.2.2.9.1.2.4.1.1:

> The Distribution Reward Calculation includes the calculation of the Fees for Unrewarded USDS Balances, the Fees for Rewarded USDS Balances, and the Prime Agent Management Fee.

Process Flow · A.2.2.9.1.2.4.1.1.2:

> Operational GovOps calculates the Distribution Reward due based on the USDS and sUSDS balances and the Distribution Reward formula for each.

Reward Payment · A.2.2.9.1.2.1.3.2:

> the average balance over the month, times

**Action:** re-filed as `stale` (medium).

## 22. A.2.2.9.2.2.1.2.3 Data Submission Frequency — real

Sweep id `A.2.2.9.2.2.1.2.3#contradiction` (`a26ea73f-ab67-4e02-93cd-b43d22a6e63c`), sweep severity medium. Both are base elements of the Integration Boost Primitive. A.2.2.9.2.2.1.3.1 makes the Cadence the frequency at which the Boost is 'calculated and distributed', with biweekly and monthly options, and A.2.2.9.2.2.4.1.1.1.1.1 triggers calculation at the end of each Cadence. A.2.2.9.2.2.1.2.3 states unconditionally that data is calculated weekly for payment the following Monday, and late data delays payment 'until the following week'. For a biweekly or monthly Instance both cannot hold, and neither text states which governs.

Data Submission Frequency · A.2.2.9.2.2.1.2.3:

> Data is calculated on a weekly basis from Monday to Sunday for payment the following Monday.

Cadence · A.2.2.9.2.2.1.3.1:

> The Cadence is the frequency at which the Integration Boost is calculated and distributed. There are only three options available for the Reward Cadence: (1) weekly, (2) biweekly, or (3) monthly.

Time-Based Triggers · A.2.2.9.2.2.4.1.1.1.1.1:

> This process is triggered at the end of each occurrence of the Cadence

**Action:** kept (medium).

## 23. A.2.2.10.1.1.1.2.5.2.5.3.3 Swap Tokens Through Uniswap v3 Pool — false positive

Sweep id `A.2.2.10.1.1.1.2.5.2.5.3.3#contradiction` (`3986fe17-e84d-407a-9192-61e6b842426a`), sweep severity medium. A.2.2.10.1.1.1.2.1.6 describes what `maxSlippage` is for in general ('trades or liquidity operations in a pool') but does not say every swap function checks it. A.2.2.10.1.1.1.2.5.2.5.3.3 is the named, function-level description of `uniswapV3_swap` and says the swap is bounded by max tick deviation against TWAP, not by maxSlippage. The add/remove-liquidity siblings (A.2.2.10.1.1.1.2.5.2.5.1.3, .2.3) check maxSlippage because they are different operations. At most the generic gloss could be narrowed; the operative swap rule is unambiguous.

Swap Tokens Through Uniswap v3 Pool · A.2.2.10.1.1.1.2.5.2.5.3.3:

> The maximum tick deviation is the only governance-configured control on the swap's execution quality; the minimum amount received has no equivalent governance floor beyond being non-zero.

MaxSlippage · A.2.2.10.1.1.1.2.1.6:

> sets the maximum allowed price impact or deviation from expected output when executing trades or liquidity operations in a pool

**Action:** moved to `rejected`.

## 24. A.2.8.1.1.1.2 Role Of Core Facilitator — false positive

Sweep id `A.2.8.1.1.1.2#contradiction` (`cf7e0654-f9a6-45e4-9984-14387067cb17`), sweep severity medium. A.2.8.1.1.1.2 isolates the Core Facilitator from the parties and limits it to information prepared by Core GovOps. A.2.8.1.1.2.3.1 requires that GovOps analysis to contain a structured presentation of each party's arguments, and A.2.8.1.1.1.1 makes GovOps the gatherer of all dispute information. So when A.2.8.1.1.2.3.2 says the Facilitator reviews 'the arguments presented by the parties' along with the analysis, a consistent reading is the arguments as conveyed by GovOps. The wording is loose, but the two texts do not set incompatible operative rules.

Role Of Core Facilitator · A.2.8.1.1.1.2:

> The Core Facilitator exclusively reviews the information prepared by Core GovOps

Adjudication By Core Facilitator · A.2.8.1.1.2.3.2:

> The Core Facilitator reviews the analysis prepared by Core GovOps along with the arguments presented by the parties

Analysis By Core GovOps · A.2.8.1.1.2.3.1:

> a structured presentation of the arguments in favor of each party

**Action:** moved to `rejected`.

## 25. A.2.8.2.2 Prime Program — real, re-filed

Sweep id `A.2.8.2.2#contradiction` (`aa3b8e65-0ded-48c2-9c40-812debf99f32`), sweep severity medium. A.2.8.2.2 says the subdocuments record terms between Sky, Grove and Spark. Its own subdocument A.2.8.2.2.1.1 says the parties are Sky, Spark, Grove and Moonbow, A.2.8.2.2.1.1.4 defines the Moonbow party, and A.2.8.2.2.2.5.1 imposes license-agreement terms involving Moonbow. The parent's party list therefore omits a party. This is an entity omission in a summary sentence rather than a clash between operative rules, so it is better filed as an entity defect.

Prime Program · A.2.8.2.2:

> The subdocuments herein record the terms of agreement between Sky, Grove, and Spark as agreed in Ecosystem Accord 2.

Parties To The Accord · A.2.8.2.2.1.1:

> The parties to Ecosystem Accord 2 are Sky, Spark, Grove, and Moonbow, as defined in the subdocuments herein.

Moonbow Details · A.2.8.2.2.1.1.4:

> The party ‘Moonbow’ is the entity owning relevant intellectual property.

**Action:** re-filed as `entity` (medium).

## 26. A.2.8.2.2.2.2.4 Minimum Borrowing Threshold for Grant Eligibility — real

Sweep id `A.2.8.2.2.2.2.4#contradiction` (`23b21d6f-ad66-42ff-9e9f-c5bd5da6e8d4`), sweep severity medium. A.2.8.2.2.2.2.1 grants subsidized borrowing for 2 years at the rate set in A.2.8.2.2.2.2.2, whose formula SOFR + ((Base_Rate - SOFR) * T/24) increases monthly, so the subsidy is (Base_Rate - SOFR) * (1 - T/24). A.2.8.2.2.2.2.4 says the reimbursement grant covers the difference between Base Rate and SOFR, with no ramp, which leaves the Prime paying SOFR throughout. Neither document carries an exception or timing split that reconciles the two, so the subsidy amount is stated two incompatible ways for the same borrowing.

Borrow Rate Mechanism · A.2.8.2.2.2.2.2:

> The borrow rate subsidy for Spark and Grove will be calculated according to the formula: `SOFR + ((Base_Rate - SOFR) * T/24)`

Minimum Borrowing Threshold for Grant Eligibility · A.2.8.2.2.2.2.4:

> This grant will cover the difference between the borrowing Base Rate and SOFR

**Action:** kept (medium).

## 27. A.6.1.1.2.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate — real

Sweep id `A.6.1.1.2.2.3.2.2.1.2.1.3#contradiction` (`75305e17-8f4b-46cc-8bb5-39fd3680a8e0`), sweep severity medium. The Upkeep Rebate Primitive (A.2.2.7.2) applies the rebate against the Holding Agent's Ecosystem Upkeep Fees, and Grove's routine step A.6.1.1.2.2.3.2.2.1.2.1.2 has Grove itself deduct it when paying. The next step, A.6.1.1.2.2.3.2.2.1.2.1.3, says Operational GovOps executes a return of surplus to token holders and may refuse the distribution. No such distribution is defined anywhere in the Primitive or the Instance, so the same routine protocol gives two incompatible mechanisms, and the GovOps gate cannot operate as written. The same wording appears in all eight Prime Instances.

Grove Deducts Rebate From Ecosystem Upkeep Fees · A.6.1.1.2.2.3.2.2.1.2.1.2:

> When paying Ecosystem Upkeep fees, Grove deducts the rebate from the fees it pays.

Operational GovOps Reviews Rebate · A.6.1.1.2.2.3.2.2.1.2.1.3:

> Operational GovOps reviews Grove’s calculation of the rebate before executing a return of surplus to token holders. In the event of any issues, Operational GovOps cannot execute the distribution.

Upkeep Rebate Primitive · A.2.2.7.2:

> This resulting rebate amount is applied against the Holding Agent’s Ecosystem Upkeep Fees due in the calendar month immediately following the Issuing Agent’s payment.

**Action:** kept (medium).

## 28. A.6.1.1.3.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate — real

Sweep id `A.6.1.1.3.2.3.2.2.1.2.1.3#contradiction` (`77ad2a49-8fa6-499b-bd26-b9fdef57fded`), sweep severity medium. The quote stopped matching because of an apostrophe change (Keel's to Keel’s) and the loss of the final period, not because the defect was fixed. A.6.1.1.3.2.3.2.2.1.2.1.2 still has Keel realise the rebate by deducting it from the upkeep fees it pays, consistent with A.2.2.7.2. A.6.1.1.3.2.3.2.2.1.2.1.3 still conditions the rebate on Operational GovOps executing a return of surplus to token holders that it can withhold. No such distribution exists in the Primitive, so the two steps still describe incompatible mechanisms.

Keel Deducts Rebate From Ecosystem Upkeep Fees · A.6.1.1.3.2.3.2.2.1.2.1.2:

> When paying Ecosystem Upkeep fees, Keel deducts the rebate from the fees it pays.

Operational GovOps Reviews Rebate · A.6.1.1.3.2.3.2.2.1.2.1.3:

> Operational GovOps reviews Keel’s calculation of the rebate before executing a return of surplus to token holders. In the event of any issues, Operational GovOps cannot execute the distribution.

**Action:** kept (medium).

## 29. A.6.1.1.3.3.2 Use Of Idle Funds — real, re-filed

Sweep id `A.6.1.1.3.3.2#contradiction` (`41ad175e-48c8-4caf-8cb7-638f90ff0ad6`), sweep severity medium. A.6.1.1.3.3.2 permits idle-fund deployments in the short term before Keel implements the Allocation System Primitive. Under A.6.1.1.3.2.6.1.3.1.1 and A.6.1.1.3.2.6.1.3.1.2, A.6.1.1.3.2.6.1.3 now holds Active Instances on Kamino (USDS, USDC, USDT, USDG, PYUSD) and Drift (USDS, USDC, USDT, PYUSD). By its own condition, the transitional clause has lapsed. That makes it a stale leftover rather than an operative rule that conflicts with the Instances. It should be retired or rescoped.

Use Of Idle Funds · A.6.1.1.3.3.2:

> In the short term prior to Keel's implementation of the Allocation System Primitive, Keel may invest idle funds in low-risk decentralized finance opportunities, including providing liquidity to established lending protocols on Solana.

Solana - Kamino USDS Instance Configuration Document · A.6.1.1.3.2.6.1.3.1.1.1:

> Solana - Kamino USDS Instance Configuration Document

Solana - Drift USDS Instance Configuration Document · A.6.1.1.3.2.6.1.3.1.2.1:

> Solana - Drift USDS Instance Configuration Document

**Action:** re-filed as `stale` (medium).

## 30. A.6.1.1.4.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate — real

Sweep id `A.6.1.1.4.2.3.2.2.1.2.1.3#contradiction` (`911e4409-146c-49e6-9f5c-5abdc58d97d3`), sweep severity medium. Skybase's routine protocol uses the same template as Grove's. Under step A.6.1.1.4.2.3.2.2.1.2.1.2 (consistent with A.2.2.7.2), Skybase applies the rebate itself as a deduction when paying fees. Step A.6.1.1.4.2.3.2.2.1.2.1.3 instead makes the rebate a GovOps-executed return of surplus to token holders that GovOps can refuse. The Primitive or Instance defines no distribution, so the two steps give incompatible mechanisms for the same rebate.

Skybase Deducts Rebate From Ecosystem Upkeep Fees · A.6.1.1.4.2.3.2.2.1.2.1.2:

> When paying Ecosystem Upkeep fees, Skybase deducts the rebate from the fees it pays.

Operational GovOps Reviews Rebate · A.6.1.1.4.2.3.2.2.1.2.1.3:

> Operational GovOps reviews Skybase's calculation of the rebate before executing a return of surplus to token holders. In the event of any issues, Operational GovOps cannot execute the distribution.

**Action:** kept (medium).

## 31. A.6.1.1.5.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate — real

Sweep id `A.6.1.1.5.2.3.2.2.1.2.1.3#contradiction` (`a8afed5e-3721-40a3-847c-3589a5dfce95`), sweep severity medium. Obex's text matches the Grove, Keel and Skybase versions. Step A.6.1.1.5.2.3.2.2.1.2.1.2 (consistent with A.2.2.7.2) realises the rebate as Obex's own deduction at fee payment. Step A.6.1.1.5.2.3.2.2.1.2.1.3 recasts it as a return of surplus to token holders that Operational GovOps executes and may block. No such distribution exists in the Primitive, so the protocol states two incompatible mechanisms.

Obex Deducts Rebate From Ecosystem Upkeep Fees · A.6.1.1.5.2.3.2.2.1.2.1.2:

> When paying Ecosystem Upkeep fees, Obex deducts the rebate from the fees it pays.

Operational GovOps Reviews Rebate · A.6.1.1.5.2.3.2.2.1.2.1.3:

> Operational GovOps reviews Obex's calculation of the rebate before executing a return of surplus to token holders. In the event of any issues, Operational GovOps cannot execute the distribution.

**Action:** kept (medium).

## 32. A.6.1.1.8.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate — real

Sweep id `A.6.1.1.8.2.3.2.2.1.2.1.3#contradiction` (`47d2823b-2e93-4a7e-b181-6c232d7429ed`), sweep severity medium. Launch Agent 7's text matches the other Primes. Step A.6.1.1.8.2.3.2.2.1.2.1.2 (consistent with A.2.2.7.2) realises the rebate as a deduction at fee payment, while step A.6.1.1.8.2.3.2.2.1.2.1.3 gates a GovOps-executed return of surplus to token holders. One detail of the claim overstates its case: the Parameters doc A.6.1.1.8.2.3.2.2.1.1 only says the right applies automatically and does not describe a mechanism. The clash between the two routine steps holds regardless.

Launch Agent 7 Deducts Rebate From Ecosystem Upkeep Fees · A.6.1.1.8.2.3.2.2.1.2.1.2:

> When paying Ecosystem Upkeep fees, Launch Agent 7 deducts the rebate from the fees it pays.

Operational GovOps Reviews Rebate · A.6.1.1.8.2.3.2.2.1.2.1.3:

> Operational GovOps reviews Launch Agent 7's calculation of the rebate before executing a return of surplus to token holders. In the event of any issues, Operational GovOps cannot execute the distribution.

**Action:** kept (medium).
