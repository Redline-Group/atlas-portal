# High-severity findings review

**Date:** 2026-11-18
**Corpus as reviewed:** `public/potential-mistakes.json` after the 2026-11-18 incremental sweep and both contradiction reviews ([2026-11-18-mistakes-contradiction-review.md](2026-11-18-mistakes-contradiction-review.md), [2026-11-18-mistakes-contradiction-backlog.md](2026-11-18-mistakes-contradiction-backlog.md)); atlas SHA `6daa01968a0fc3fe67fdedc45761cf33ba114515`. Scope: every `high` row those reviews did not already cover — 125 rows (73 language-pass, 34 factual-pass, 18 mechanical).
**Question:** does each defect hold as described, under the right category, at the right confidence?
**Method:** each row was read against the flagged document and whatever siblings, parents or linked documents the claim depends on, at the SHA above. Severity is the sweep's confidence that the defect is real, so a real but cosmetic defect keeps `high` unless the reading is uncertain; where a reviewer lowered it, the reason is in the row. Every quote below was checked mechanically as a verbatim substring of the document it is attributed to.
**Who decided:** AI reviewers (Claude subagents) read each row and gave the verdicts; Claude checked every cited quote mechanically and made the review calls listed below. No person re-checked the rows. In `public/potential-mistakes.json`, each veto this review recorded carries `rejectedBy`: `human` for a person's call, `ai-review` otherwise, so the AI-decided vetoes can be audited and confirmed or reopened.

---

## Bottom line

**106 real, 10 real but re-filed, 7 false positives, 2 duplicates, 0 fixed upstream.** 24 kept rows had their severity lowered. The sweep's high bucket is overwhelmingly right: most rejections are rendering-neutral markdown, link labels that follow the sibling pattern, and ICD conventions the sweep read as errors.

Review calls on top of the reviewers' verdicts:

- Rows 11 and 12 report the same `elements,and` typo in A.1.10.2.4.7.4.4, once from the language pass and once from the mechanical scan; row 12 is rejected as the duplicate.
- Row 113 reports the "swapped for USDC" slip in A.6.1.1.3.2.6.1.2.1.1.3.2.2.2 that the contradiction backlog review already re-filed as `wrong-word`; rejected as the duplicate.
- Row 115 (Keel's 1/2 signing threshold against a majority rule, A.6.1.1.3.2.6.1.2.1.2.2.1) is filed as `numeric`, matching the identical Spark row 71 (A.6.1.1.1.2.6.1.2.1.2.2.1.2), rather than `contradiction`.
- Row 43's quote (A.3.2.2.1.2.3.3.2.3) spanned a `$$` math delimiter it omitted, which hid it as "Quote no longer in doc"; its quote is re-anchored on the formula line, the defect unchanged.
- Nine rows (52–57, 59–61) are the same Keel template drift: each In Progress Invocations Directory under A.6.1.1.3 sends completed Invocations to the Active Instances container instead of the Active Instances Directory, as Keel's own A.6.1.1.3.2.6.1.1.4 and every other Prime do.

| # | Finding | Category | Verdict | Action | Reason |
|---|---|---|---|---|---|
| 1 | A.1.1.3.1.0.6.1 List Of Atlas Interpretations | wrong-word | Real | kept | A.1.1.3.1.0.6.1 says payments are made at the 'proscribed' (forbidden) conversion rate; 'prescribed' is plainly meant. |
| 2 | A.1.2.1.1 Document Identifiers | grammar | Real | kept | In A.1.2.1.1 the plural subject 'The Document Identifiers' takes 'help' and then the singular 'makes' in the same compound predicate. |
| 3 | A.1.2.1.2.5 Components Property | grammar | Real | kept | A.1.2.1.2.5 pairs the plural subject 'The Components' with the singular verb 'is'. |
| 4 | A.1.2.2.2.1 The Type Specification Type | structural | Real | kept | A.1.2.2.2.1 lists Translation Document as a Type Category, but A.1.2.2.1 defines the Adaptive groups as Primary, Supporting and Accessory, and A.1.2.2.2.23/.24 use Accessory Document. |
| 5 | A.1.2.2.2.3 The Scope Type | structural | Real, re-filed | re-filed as `numeric` | A.1.2.2.2.3 says six Scope documents (A.1 to A.6) and then '5 Atlas Scopes' in the next sentence; the count is wrong, a numeric defect rather than a structural one. |
| 6 | A.1.2.2.2.8 The Original Context Data Type | grammar | Real | kept | In A.1.2.2.2.8, with an 'or' compound the verb agrees with the nearer plural 'new external events', so 'make' is required, not 'makes'. |
| 7 | A.1.2.2.2.29 The Scenario Variation Type | typo | Real | kept, severity low | A.1.2.2.2.29 has a stray space between the closing backtick of the example identifier and the sentence period. The defect is real but cosmetic. |
| 8 | A.1.5.10.2.0.6.1 Derecognized Alignment Conservers | stale | Real, re-filed | re-filed as `numeric`, fix corrected | In A.1.5.10.2.0.6.1 the 0xDefensor row is dated 2023-02-02, but its reasoning post's slug says 02-02-2024 and the row sits between 2023-10-30 and 2024-04-06 rows. It is a wrong year, not stale data. |
| 9 | A.1.7.6 Acting Against Misalignment | grammar | Real | kept | A.1.7.6's last sentence says 'adjudicated by Core GovOps to the same process', which does not parse. The parallel sentence just before it uses 'pursuant to'. |
| 10 | A.1.10.2.3.2.1.3.1 Governance Point Includes Module Deployment In The Executive Sheet | xref | Real | kept | A.1.10.2.3.2.1.3.1 names the Atlas Edit Proposal Forum post but links A.1.10.2.3.2.1.2.1.2 (Technical Scope Forum Post), the same link it later uses for the Derived Action; the proposal is A.1.10.2.3.2.1.1.1.4. |
| 11 | A.1.10.2.4.7.4.4 Lindy-Based Risk Aversion | typo | Real | kept | A.1.10.2.4.7.4.4 is missing a space after the comma in 'elements,and'. |
| 12 | A.1.10.2.4.7.4.4 Lindy-Based Risk Aversion | typo | Duplicate | rejected (duplicate of `A.1.10.2.4.7.4.4#typo`) | A.1.10.2.4.7.4.4 has 'elements,and' with no space after the comma. |
| 13 | A.1.10.2.4.9.2.3 A.1.9 -Spell Reviewer Direct Authoring Ban | copy-paste | Real | kept | The title of A.1.10.2.4.9.2.3 contains a stray, unrelated 'A.1.9 -' fragment before the real title text. |
| 14 | A.1.10.2.4.10.6 Spell Crafter Archives Spell | structural | Real | kept | A.1.10.2.4.10.6 ends mid-clause after 'where "YYYY-MM-DD"', so it never says what date to pass when the current date differs from the Target Date. |
| 15 | A.1.10.2.4.11.1.6 Governance Point Validates Executive Document | markdown | Real | kept, fix corrected | In A.1.10.2.4.11.1.6 the opening '(' is itself a leftover link to vote.makerdao.com. The stored fix drops the surrounding parentheses, so the fix keeps them and removes only the stale link. |
| 16 | A.1.12.2.4 Atlas Edit Proposal Statuses | grammar | Real | kept | A.1.12.2.4 writes 'a AEP Author'. AEP is read as letters beginning with a vowel sound, and the same document uses 'An AEP' throughout. |
| 17 | A.1.14.2.9.2 Role Of Executor Agent Artifacts | typo | Real | kept, severity low | The single sentence in A.1.14.2.9.2 ends without terminal punctuation. The defect is real but minor. |
| 18 | A.2.2.1.1.3.2 Founder Access | markdown | Real | kept, severity medium | A.2.2.1.1.3.2 opens with '_"_', which italicises only the opening quote mark. It is a stray-markup glitch, and the same term appears later in plain quotes. |
| 19 | A.2.2.1.1.13 Core GovOps Validates Executor Accord Primitive Inputs | typo | Real | kept | A.2.2.1.1.13 writes 'CoreGovOps', while its own title and later sentence use 'Core GovOps'. It is the only such occurrence in the atlas. |
| 20 | A.2.2.9.1.2.4.1.1.4.2 Agent Artifact Updates | grammar | Real | kept | A.2.2.9.1.2.4.1.1.4.2 omits 'in' before the link, while the sibling Agent Artifact Updates docs (e.g. A.2.2.9.1.2.4.1.2.4.2) read 'specified in [...]'. |
| 21 | A.2.2.9.1.2.4.1.3.4.1 Sky Core Atlas Updates | placeholder | Real | kept | A.2.2.9.1.2.4.1.3.4.1 leaves the 'Payment Inaccuracy Previously Found By Core GovOps' branch as a bare 'TBD' with no document updates specified. |
| 22 | A.2.2.9.1.2.4.1.4.1.1.2 Document Update Triggers | markdown | False positive | rejected | A.2.2.9.1.2.4.1.4.1.1.2 has two adjacent bold spans (bold code, then bold text) separated by a space, not empty bold markers; it renders correctly. |
| 23 | A.2.2.9.2.2.4.1.1.4.2 Agent Artifact Updates | grammar | Real | kept | A.2.2.9.2.2.4.1.1.4.2 omits 'in' before the link, while the sibling docs (e.g. A.2.2.9.2.2.4.1.2.4.2) read 'specified in [...]'. |
| 24 | A.2.4.1.2.2.1.1.2.3.2.1 Excess Low Yield Actively Stabilizing Collateral Percentage | xref | Real | kept | A.2.4.1.2.2.1.1.2.3.2.1 cites the Penalty document (A.2.4.1.2.2.1.1.2.3.2) for the term Low Yield Actively Stabilizing Collateral, which its own child A.2.4.1.2.2.1.1.2.3.2.1.1 defines. |
| 25 | A.2.8.2.1.1.2 Duration Of The Accord | stale | Real | kept | A.2.8.2.1.1.2 sets a six-month term starting May 29, 2025, which has ended, yet Accord 1 stays under A.2.8.2 'currently active' Accords with no renewal term. Accord 10 (A.2.8.2.10.1.2), by contrast, is stated to be indefinite. |
| 26 | A.2.8.2.1.2.4.1 DeFi Opportunities Right of First Refusal Duration | markdown | Real | kept, fix corrected | In A.2.8.2.1.2.4.1, '_Example:__' has an extra underscore. The paragraph closes with 'four weeks._', and the stored fix would leave that final underscore unmatched. |
| 27 | A.2.8.2.2.2.7.4 Treatment of Expenses Paid By Sky Pre-TGE | stale | False positive | rejected | The 'after July 1, 2025' window is intentional: A.2.8.2.2.2.7.5 credits income from July 1 until TGE net of A.2.8.2.2.2.7.4 expenses, and the Spark 2m/2.4m advances are authorized by their own children .4.1/.4.2. |
| 28 | A.2.9.1.1.1.4.1.2 Resilience Fund Proof Of Eligibility Template | typo | Real | kept | The A.2.9.1.1.1.4.1.2 template lists .x.1, .x.2 and .x.3, then '.x4', which is missing the dot. |
| 29 | A.2.9.1.1.1.4.2.2.1 Resilience Fund Claim Approval Payout Claim | grammar | Real | kept, fix corrected | In A.2.9.1.1.1.4.2.2.1 a sentence break is missing after 'Governmental Agency'. The fix is narrowed to the punctuation only, because the word change belongs to n=30. |
| 30 | A.2.9.1.1.1.4.2.2.1 Resilience Fund Claim Approval Payout Claim | wrong-word | Real | kept | In A.2.9.1.1.1.4.2.2.1, 'highly sensible' is followed by a requirement to use encryption tools, so 'sensitive' is meant. |
| 31 | A.2.9.1.1.1.4.2.2.4 Resilience Fund Claim Approval Technical Commitee Review | typo | Real | kept | Title of A.2.9.1.1.1.4.2.2.4 spells 'Commitee' while its body and sibling A.2.9.1.1.1.4.2.2.5 spell 'Committee'. |
| 32 | A.2.11.1.2.4 Frontends | grammar | Real | kept | A.2.11.1.2.4 writes 'terms of conditions' where the same document's first sentence uses the correct 'terms and conditions'. |
| 33 | A.3.2.1.2.2.2.1.2 External Senior Risk Capital | grammar | Real | kept | In A.3.2.1.2.2.2.1.2 the relative clause refers to the singular 'the srUSDS smart contract', so 'which allow' should be 'which allows'. |
| 34 | A.3.2.2.1.1.1.1.1.2 Calculate Loss Given Default | numeric | Real | kept | The A.3.2.2.1.1.1.1.1.2 formula min(..., 0) caps LGD at 0, making it non-positive. The reference implementation (A.3.2.2.1.1.1.1.5) floors at 0 and caps at 1 instead. |
| 35 | A.3.2.2.1.1.1.1.1.3.1 Lower Bound | wrong-word | Real | kept | A.3.2.2.1.1.1.1.1.3.1 says 'set of `0.13`' where the parameter-value idiom used elsewhere (e.g. A.3.2.2.1.2.2.3.3.10) is 'set to'. |
| 36 | A.3.2.2.1.1.1.1.1.4 Calculate Capital Requirement Without Buffers | structural | Real | kept, severity medium | K is the Sensitivity Factor (=10) in A.3.2.2.1.1.1.1.1.3.3 and is reused as the Capital Requirement Without Buffers in A.3.2.2.1.1.1.1.1.4, which A.3.2.2.1.1.1.1.1.5 then multiplies into RRC. |
| 37 | A.3.2.2.1.1.1.2 Perpetual Positions | grammar | Real | kept | In A.3.2.2.1.1.1.2 the singular subject 'treatment' takes 'is', not 'are'. |
| 38 | A.3.2.2.1.1.1.3 Direct Exposures | grammar | Real | kept | In A.3.2.2.1.1.1.3 the singular subject 'treatment' takes 'is', not 'are'. |
| 39 | A.3.2.2.1.1.1.4 Bond-Like Instruments | grammar | Real | kept | In A.3.2.2.1.1.1.4 the singular subject 'treatment' takes 'is', not 'are'. |
| 40 | A.3.2.2.1.1.1.6 Cash Stablecoins | grammar | Real | kept | In A.3.2.2.1.1.1.6 the singular subject 'treatment' takes 'is', not 'are'. |
| 41 | A.3.2.2.1.2.2.3.3.10 Code Size Factor | typo | Real | kept | The body of A.3.2.2.1.2.2.3.3.10 says 'Code Size Factory' but the document is titled 'Code Size Factor' and describes a factor. |
| 42 | A.3.2.2.1.2.3.1.1 Low Risk Protocols | grammar | Real | kept | A.3.2.2.1.2.3.1.1 has the ungrammatical 'between less than or equal to'. Siblings A.3.2.2.1.2.3.1.2 and A.3.2.2.1.2.3.1.3 state their bounds without a stray 'between'. |
| 43 | A.3.2.2.1.2.3.3.2.3 F2 Function | structural | Real | kept | Despite the 'fixed' status, A.3.2.2.1.2.3.3.2.3 still writes the coefficient as $a$ but defines $\alpha$ = 0.1. A.3.2.2.1.2.3.1.2.5.2 already defines alpha as (r-25)/(50-25). |
| 44 | A.3.2.2.1.2.4.2.2.2 Effective Age | numeric | Real | kept, severity medium | The referenced AGEeff is contract age in months times a log factor (A.3.2.2.1.2.2.4.3, .4.3.1). A.3.2.2.1.2.4.2.2 uses it as a 0-1 weight, and A.3.2.2.1.2.4.2.2.2 caps it in years, so units and scale do not match. |
| 45 | A.3.2.2.1.3.1.3 Delay Factor | naming | Real | kept | A.3.2.2.1.3.1.3 is titled 'Delay Factor' and uses 'Delay Factor' from its second paragraph on, but its opening sentence calls it 'Delay Adjustment Factor'. |
| 46 | A.3.2.2.7.2.1.1.2 Severity Of Breaches | xref | Real | kept | A.3.2.2.7.2.1.1.2 lists 'High ... and Low Severity Breaches' then links .4 (Low) and .5 (High) 'respectively', pairing each severity with the other's penalty doc. |
| 47 | A.3.2.2.7.2.1.1.7 Short-Term Exemption | grammar | Real | kept | A.3.2.2.7.2.1.1.7 uses 'a' before the vowel sound in 'Encumbrance'; it should be 'an'. |
| 48 | A.3.3.2.7.1.1.1.1 Lite Peg Stability Module Toll / Fee In Definition | markdown | Real | kept | In A.3.3.2.7.1.1.1.1 a stray bold markup wraps only the final period. |
| 49 | A.3.4.3.1 Introduction | typo | Real | kept | A.3.4.3.1 misspells 'Ecosystem' as 'Ecoystem' but spells 'Ecosystem Actors' correctly in its first sentence. |
| 50 | A.3.7.1.1.2.6 Debt Floor (dust) | typo | Real | kept | A.3.7.1.1.2.6 capitalizes 'DAi' wrongly once; every other use in the document is 'Dai'. |
| 51 | A.3.7.1.5.4.1 Requirements | markdown | Real | kept | In A.3.7.1.5.4.1 a stray bold markup wraps only the period after the link. |
| 52 | A.6.1.1.*.2.2.1.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.2.1.1.4 sends completed Invocations to the container A.6.1.1.3.2.2.1.2; Spark A.6.1.1.1.2.2.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 53 | A.6.1.1.*.2.2.3.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.2.3.1.4 sends completed Invocations to the container A.6.1.1.3.2.2.3.2; Spark A.6.1.1.1.2.2.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 54 | A.6.1.1.*.2.4.1.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.4.1.1.4 sends completed Invocations to the container A.6.1.1.3.2.4.1.2; Spark A.6.1.1.1.2.4.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 55 | A.6.1.1.*.2.5.1.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.5.1.1.4 sends completed Invocations to the container A.6.1.1.3.2.5.1.2; Spark A.6.1.1.1.2.5.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 56 | A.6.1.1.*.2.5.2.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.5.2.1.4 sends completed Invocations to the container A.6.1.1.3.2.5.2.2; Spark A.6.1.1.1.2.5.2.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 57 | A.6.1.1.*.2.5.3.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.5.3.1.4 sends completed Invocations to the container A.6.1.1.3.2.5.3.2; Spark A.6.1.1.1.2.5.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 58 | A.6.1.1.*.2.6.1.2.2.3.2.1 (corpus-wide) | structural | False positive | rejected | All four ERC-4626 Withdrawal Action docs direct the same call, redeemERC4626(address(token), token.balanceOf(address(proxy))); only the wording (execute action vs call function) differs. |
| 59 | A.6.1.1.*.2.6.2.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.6.2.1.4 sends completed Invocations to the container A.6.1.1.3.2.6.2.2; Spark A.6.1.1.1.2.6.2.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 60 | A.6.1.1.*.2.6.3.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.6.3.1.4 sends completed Invocations to the container A.6.1.1.3.2.6.3.2; Spark A.6.1.1.1.2.6.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 61 | A.6.1.1.*.2.7.1.1.4 (corpus-wide) | structural | Real | kept, severity medium, fix corrected | Keel's A.6.1.1.3.2.7.1.1.4 sends completed Invocations to the container A.6.1.1.3.2.7.1.2; Spark A.6.1.1.1.2.7.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory. |
| 62 | A.6.1.1.1.2.2.2.2.1.2.4 Short-Term Transitionary Measures | stale | Real | kept | A.6.1.1.1.2.2.2.2.1.2.4 still gives a 'currently estimated' handover date of September 17, 2025, which has passed, and remains in future tense. |
| 63 | A.6.1.1.1.2.5.2.1.4 In Progress Invocations Directory | markdown | Real, re-filed | re-filed as `typo` | A.6.1.1.1.2.5.2.1.4 has the doubled punctuation ',;' after the link. This is a punctuation typo, not a markdown error, and the fix to ', whereas' is correct. |
| 64 | A.6.1.1.1.2.6.1.2.1.1.1.2.1.4 ALM Relayer Multisig (Mainnet) Address | grammar | Real | kept | In A.6.1.1.1.2.6.1.2.1.1.1.2.1.4 the number agreement is mixed ('address... are', 'Multisigs that has') and two addresses are linked, so plural 'addresses... have' is right. |
| 65 | A.6.1.1.1.2.6.1.2.1.1.1.2.2.4 ALM Relayer Multisig (Base) Address | grammar | Real | kept | In A.6.1.1.1.2.6.1.2.1.1.1.2.2.4 the number agreement is mixed ('address... are', 'Multisigs that has') and two addresses are linked, so plural 'addresses... have' is right. |
| 66 | A.6.1.1.1.2.6.1.2.1.1.1.2.3.4 ALM Relayer Multisig (Arbitrum) Address | grammar | Real | kept | A.6.1.1.1.2.6.1.2.1.1.1.2.3.4 mixes singular 'address'/'has' with plural 'Multisigs'/'are'; fix makes it agree. |
| 67 | A.6.1.1.1.2.6.1.2.1.1.1.2.4.4 ALM Relayer Multisig (Unichain) Address | grammar | Real | kept | A.6.1.1.1.2.6.1.2.1.1.1.2.4.4 carries the same address/has/are agreement error as its Arbitrum and Optimism siblings. |
| 68 | A.6.1.1.1.2.6.1.2.1.1.1.2.5.4 ALM Relayer Multisig (Optimism) Address | grammar | Real | kept | A.6.1.1.1.2.6.1.2.1.1.1.2.5.4 carries the same address/has/are agreement error as its Arbitrum and Unichain siblings. |
| 69 | A.6.1.1.1.2.6.1.2.1.1.1.2.6.5 ALM Proxy (Avalanche) Contract | placeholder | Real | kept | A.6.1.1.1.2.6.1.2.1.1.1.2.6.5 gives the Avalanche ALM_PROXY address as `TBD`, while sibling Avalanche contracts (e.g. .6.7 ALM Proxy Freezable) carry real addresses. |
| 70 | A.6.1.1.1.2.6.1.2.1.1.1.2.6.6 ALM Rate Limits (Avalanche) Contract | placeholder | Real | kept | A.6.1.1.1.2.6.1.2.1.1.1.2.6.6 gives the Avalanche ALM_RATE_LIMITS address as `TBD`; sibling Avalanche contract docs (.6.1, .6.7) carry real addresses. |
| 71 | A.6.1.1.1.2.6.1.2.1.2.2.1.2 Required Number Of Signers | numeric | Real | kept | A.6.1.1.1.2.6.1.2.1.2.2.1.2 states 1/2, but .1.5 requires a majority of signers to execute; with two signers (.1.3) a majority is 2. |
| 72 | A.6.1.1.1.2.6.1.2.1.2.2.2.2 Required Number Of Signers | numeric | Real | kept | A.6.1.1.1.2.6.1.2.1.2.2.2.2 (and .2.3) state 2/5, but .2.5 requires at least two-thirds of signers to execute; two-thirds of 5 rounds up to 4. |
| 73 | A.6.1.1.1.2.6.1.2.2.1.1 Role Hierarchy And Permissions | grammar | Real | kept | A.6.1.1.1.2.6.1.2.2.1.1 says 'documents herein defines'; sibling A.6.1.1.1.2.6.1.2.2.1.3 uses 'documents herein define'. |
| 74 | A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.3 Withdraw Aave ATokens | duplication | Real | kept, fix corrected | A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.3 has the same title, body and link as its sibling .2.2.2.2.2; the stored fix is empty. |
| 75 | A.6.1.1.1.2.6.1.2.2.1.3 Rate Limit Management | naming | Real | kept, severity medium, fix corrected | A.6.1.1.1.2.6.1.2.2.1.3 writes the term as `RateLimits` in one sentence and as plain 'ratelimits' in the next; fix should keep the backtick form. |
| 76 | A.6.1.1.1.2.6.1.2.2.3.6 USDS Burn Action | grammar | Real | kept | A.6.1.1.1.2.6.1.2.2.3.6 drops the leading 'For'; every sibling action doc (e.g. A.6.1.1.1.2.6.1.2.2.3.5) reads 'For more detailed instructions...'. |
| 77 | A.6.1.1.1.2.6.1.3.1.4.2.2 Parameters | entity | Real | kept | Now A.6.1.1.1.2.6.1.3.1.4.2.2; its parent .4.2 is the USDC Instance (ETH is .4.1), yet it names the ETH Instance; the sibling USDT Parameters doc .4.3.2 names USDT. |
| 78 | A.6.1.1.1.2.6.1.3.2.1.1.4.1 Market Exposure | grammar | Real | kept | A.6.1.1.1.2.6.1.3.2.1.1.4.1 pairs plural 'documents' with 'contains' and lacks a final period. |
| 79 | A.6.1.1.1.2.6.1.4.1.4.1.3 Instance-specific Operational Processes | grammar | Real | kept | Now A.6.1.1.1.2.6.1.4.1.4.1.3; still reads 'documents herein defines' (plural subject, singular verb). |
| 80 | A.6.1.1.1.2.6.1.4.1.4.1.3.1.1 Addresses Of Delegated Signers | typo | Real | kept | Now A.6.1.1.1.2.6.1.4.1.4.1.3.1.1; 'addesses' is still misspelled. |
| 81 | A.6.1.1.1.3.1.3.4.3 Minimum Term | stale | Real | kept | A.6.1.1.1.3.1.3.4.3 keeps a future-tense transition for the July 1, 2026 checkpoint, already passed; the registry (A.6.1.1.1.3.1.3.8.2.0.6.1) records the 2026-07-01 term. |
| 82 | A.6.1.1.1.3.2.1.1.3.1.2 SparkLend Risk Parameters Cap Automator Cooldown Period Definition | grammar | Real | kept | A.6.1.1.1.3.2.1.1.3.1.2 describes the single `ttl` parameter as 'parameters is'. |
| 83 | A.6.1.1.1.3.2.1.1.3.2.5 SparkLend Cap Automator sDai Parameters | naming | Real | kept, severity medium | A.6.1.1.1.3.2.1.1.3.2.5 writes the asset as 'sDai' (title, supply cap) but as 'sDAI' in the borrow-cap max line. |
| 84 | A.6.1.1.1.3.2.1.1.3.2.9 SparkLend Cap Automator sUSDS Parameters | grammar | Real | kept | A.6.1.1.1.3.2.1.1.3.2.9 says '50 millions sUSDS' while the same list says '500 million sUSDS'. |
| 85 | A.6.1.1.1.3.2.1.2.3.2 Standard Agreement Post SPK Launch | grammar | Real | kept | A.6.1.1.1.3.2.1.2.3.2 puts a stray article in 'by the Spark' but writes bare 'from Spark' in the same sentence. |
| 86 | A.6.1.1.1.3.4.2.1.1 Definition | xref | Real, re-filed | re-filed as `naming` | The links are correct, but the term is not: A.6.1.1.1.3.4.2.1.1 says 'Target Risk Tolerance Ratio' and .2.2.2 says 'Risk Tolerance Ratio', while the cited .2.1.3 defines only 'Target Encumbrance Ratio'. |
| 87 | A.6.1.1.1.3.5.3.2.3.2 Spark Savings USDT on Ethereum | xref | Real | kept, severity medium | A.6.1.1.1.3.5.3.2.3.2 labels its link 'Onchain Parameters', but the target A.6.1.1.1.3.5.2.2.2 is titled 'Spark Savings USDT on Ethereum'; the UUID itself is correct. |
| 88 | A.6.1.1.1.3.5.3.2.3.6 Spark Savings USDG on Robinhood Chain | xref | Real | kept, severity medium | A.6.1.1.1.3.5.3.2.3.6 labels its link 'Onchain Parameters', but the target A.6.1.1.1.3.5.2.2.6 is titled 'Spark Savings USDG on Robinhood Chain'; the UUID is correct. |
| 89 | A.6.1.1.1.3.5.3.2.3.7 Spark Savings USDT on Arbitrum | xref | False positive | rejected | The link resolves to the right doc (A.6.1.1.1.3.5.3.2.2 'Operational Process'); the label just prefixes the parent title A.6.1.1.1.3.5.3.2 'Rewards Rate', the same pattern every sibling uses. |
| 90 | A.6.1.1.1.3.5.3.2.3.7 Spark Savings USDT on Arbitrum | xref | Real | kept, severity low, fix corrected | The link to A.6.1.1.1.3.5.2.2.7 ('Spark Savings USDT on Arbitrum') carries the A.6.1.1.1.3.5.2 section title 'Onchain Parameters'; target correct; siblings .3.2/.3.6/.3.8/.3.9 repeat it. |
| 91 | A.6.1.1.1.3.5.3.2.3.7 Spark Savings USDT on Arbitrum | xref | False positive | rejected | The link resolves to the right doc (A.6.1.1.1.3.5.3.2.1 'Definition'); the label just prefixes the parent title 'Rewards Rate' (A.6.1.1.1.3.5.3.2), the same pattern every sibling uses. |
| 92 | A.6.1.1.1.3.5.3.2.3.8 Spark Savings USDT on X Layer | xref | Real | kept, severity medium | A.6.1.1.1.3.5.3.2.3.8 labels its link 'Onchain Parameters', but the target A.6.1.1.1.3.5.2.2.8 is titled 'Spark Savings USDT on X Layer'; the UUID is correct. |
| 93 | A.6.1.1.1.3.7.2.7.3 Quorum and Signers | wrong-word | Real | kept | A.6.1.1.1.3.7.2.7.3 lists signer entities; 'legal council' should be 'legal counsel' (legal advisers). |
| 94 | A.6.1.1.1.3.8.2.7.3 Quorum and Signers | wrong-word | Real | kept | A.6.1.1.1.3.8.2.7.3 has the same 'legal council' malapropism as A.6.1.1.1.3.7.2.7.3. |
| 95 | A.6.1.1.2.2.3.2 Upkeep Rebate Primitive | grammar | Real | kept, fix corrected | A.6.1.1.2.2.3.2 says 'Groves Instance'; siblings like A.6.1.1.2.2.1.1 use 'Grove’s Instance' (curly apostrophe, so the fix should use ’). |
| 96 | A.6.1.1.2.2.5.1.1 Primitive Hub Document | grammar | Real | kept, fix corrected | A.6.1.1.2.2.5.1.1 says 'Groves usage'; sibling hub docs like A.6.1.1.2.2.1.1.1 use 'Grove’s usage' (curly apostrophe). |
| 97 | A.6.1.1.2.2.5.2.1.4 In Progress Invocations Directory | markdown | Real, re-filed | re-filed as `typo`, severity medium | A.6.1.1.2.2.5.2.1.4 has a visible stray space before the final period; this is a punctuation slip, not broken markdown. Siblings like A.6.1.1.2.2.5.1.1.4 have none. |
| 98 | A.6.1.1.2.2.6.1.2.1.2.1 Invoking New Instances | grammar | Real | kept, severity medium | A.6.1.1.2.2.6.1.2.1.2.1 runs 'process see [' together with no punctuation; the same boilerplate repeats in the Spark and Keel siblings (A.6.1.1.1.2.6.1.2.1.2.1). |
| 99 | A.6.1.1.2.2.6.1.3.1.4.1.3 Instance-specific Operational Processes | grammar | Real | kept | A.6.1.1.2.2.6.1.3.1.4.1.3 pairs plural 'documents' with 'defines'; the same copied sentence also appears in Spark's A.6.1.1.1.2.6.1.4.1.4.1.3. |
| 100 | A.6.1.1.2.2.6.1.3.1.4.1.3.1.1 Addresses Of Delegated Signers | entity | Real | kept, fix corrected | A.6.1.1.2.2.6.1.3.1.4.1.3.1.1 is in the Grove Artifact but defers to 'the Spark Artifact'; every other deferral under A.6.1.1.2 says 'Grove Artifact' (e.g. .4.1.2.3). It also misspells 'addesses'. |
| 101 | A.6.1.1.2.2.6.1.3.1.4.1.3.1.1 Addresses Of Delegated Signers | typo | Real | kept | A.6.1.1.2.2.6.1.3.1.4.1.3.1.1 misspells 'addresses' as 'addesses'. |
| 102 | A.6.1.1.2.2.6.1.3.1.4.3.2.2.1 Token Address | entity | Real | kept, severity medium | PT-USDe Instance (Token: PT-USDe, A.6.1.1.2.2.6.1.3.1.4.3.2.1.4) gives the USDe Token Address of A.6.1.1.2.2.6.1.3.1.4.1.2.2.1; it also differs from sibling PT-sUSDe, which uses the supplied USDC. |
| 103 | A.6.1.1.2.2.6.1.3.1.4.4.2.2.1 Token Address | entity | Real | kept, severity low | PT-sUSDe Token Address equals its USDC Underlying Asset Address; off-chain Paxos ICDs use that Token=Underlying pattern, but this ICD names Token: PT-sUSDe and sibling PT-USDe uses a non-USDC address. |
| 104 | A.6.1.1.2.2.6.1.3.1.6.2 Ethereum Mainnet - Curve RLUSD/USDC Pool Instance Configuration Document | structural | Real | kept | A.6.1.1.2.2.6.1.3.1.6.2 duplicates A.6.1.1.2.2.6.1.3.1.6.1: same title, same Pool Address, same Swap RateLimitID and same swap limits. |
| 105 | A.6.1.1.2.2.6.1.4.1.1.1.2.3.2 Outflow RateLimitID | copy-paste | Real | kept | Renumbered A.6.1.1.2.2.6.1.4.1.1.1.2.3.2 still starts its body with a pasted '**Outflow RateLimitID** _(Core)_ -' fragment; sibling A.6.1.1.2.2.6.1.4.1.1.1.2.3.1 has no such prefix. |
| 106 | A.6.1.1.2.2.6.1.3.1.15.1.2.2.1 Token Address | entity | False positive | rejected | Every Paxos conversion ICD sets Token Address = Underlying = supplied asset, not Token to Receive (e.g. Spark USDC To PYUSD A.6.1.1.1.2.6.1.3.1.7.1.2.2.1 uses USDC), so USDC here follows the convention. |
| 107 | A.6.1.1.2.2.6.1.3.7.1.1.2.5.1 Maximum Exposure | numeric | False positive | rejected | Maximum Exposure caps are stated in USDS house-wide regardless of asset (e.g. ACRDX exposure in USDS at A.6.1.1.2.2.6.1.3.1.1.3.2.5.1), so a USDS-denominated USDG cap is consistent. |
| 108 | A.6.1.1.2.2.6.3 Asset Liability Management Rental Primitive | typo | Real | kept, fix corrected | A.6.1.1.2.2.6.3 has 'Groves Instances' where sibling docs like A.6.1.1.2.2.6.2 use 'Grove’s' (curly apostrophe); A.6.1.1.2.2.3.2 has the same slip. |
| 109 | A.6.1.1.2.3.6.7 Authorization To Subscribe And Purchase Notes Issued By Galaxy CLO | markdown | Real | kept | The link target in A.6.1.1.2.3.6.7 starts 'ttps://', which drops the 'h', so the link is broken. |
| 110 | A.6.1.1.3.2.5.2.2.4.1.6 Integration Boost Data Submission Responsible Actor | typo | Real | kept | A.6.1.1.3.2.5.2.2.4.1.6 ends its sentence with a doubled period. |
| 111 | A.6.1.1.3.2.5.2.3.1.1.2 Integration Partner Reward Address | markdown | Real | kept | In A.6.1.1.3.2.5.2.3.1.1.2 the code span holds a trailing space and no space separates it from 'on', so the address is copied with whitespace. |
| 112 | A.6.1.1.3.2.6.1.1.4 In Progress Invocations Directory | markdown | Real | kept | A.6.1.1.3.2.6.1.1.4 has no space between 'to' and the link, so the rendered text reads 'moved toA.6.1.1.3.2.6.1.1.2 …'. |
| 113 | A.6.1.1.3.2.6.1.2.1.1.3.2.2.2 USDC For USDS Swap Maximum | copy-paste | Duplicate | rejected (duplicate of `A.6.1.1.3.2.6.1.2.1.1.3.2.2.2#wrong-word`) | A.6.1.1.3.2.6.1.2.1.1.3.2.2.2 is titled USDC For USDS but its body says 'swapped for USDC'; sibling .2.2.3 correctly names its target, USDT. |
| 114 | A.6.1.1.3.2.6.1.2.1.2.1 Invoking New Instances | grammar | Real | kept | In A.6.1.1.3.2.6.1.2.1.2.1 'process see' runs on without punctuation; A.6.1.1.7.2.6.1.2.1.2.2 uses 'process, see', and other primes' copies share the slip. |
| 115 | A.6.1.1.3.2.6.1.2.1.2.2.1.2 Required Number Of Signers | numeric | Real, re-filed | kept | A 1/2 threshold is not a majority of two signers, contradicting the Modification rule of the same multisig at A.6.1.1.3.2.6.1.2.1.2.2.1.5. |
| 116 | A.6.1.1.3.2.6.1.2.1.2.3.1.4 Usage Standards | markdown | Real | kept | A.6.1.1.3.2.6.1.2.1.2.3.1.4 has no space between 'the' and the link, so the rendered text runs the two together. |
| 117 | A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.6.2 Bridge USDS / sUSDS Using SkyBridge (LayerZero OFT) Token Bridge | entity | Real, re-filed | re-filed as `copy-paste` | Title names SkyBridge (LayerZero OFT) but body says OP Token Bridge, copied verbatim from Spark's A.6.1.1.1.2.6.1.2.2.1.2.1.2.5.2. |
| 118 | A.6.1.1.3.2.6.1.2.2.2.1.3.2.1 Get Rate Limit Data | structural | Real, re-filed | re-filed as `copy-paste` | Under Integration Level Rate Limits (A.6.1.1.3.2.6.1.2.2.2.1.3.2), the text says 'Reserve level rate limit', copied from the Reserve-level doc A.6.1.1.3.2.6.1.2.2.2.1.3.1.1. |
| 119 | A.6.1.1.3.2.6.1.2.2.2.3.4 AtomicSwap Action | entity | Real, re-filed | re-filed as `copy-paste` | Solana Emergency Protocol doc (parent A.6.1.1.3.2.6.1.2.2.2.3) carries the Mainnet swapUSDCToUSDS Solidity action copied from Mainnet emergency docs; the Solana AtomicSwap is A.6.1.1.3.2.6.1.2.2.2.1.2.1.2.3. |
| 120 | A.6.1.1.4.2.5.1.1.4 In Progress Invocations Directory | typo | Real | kept | A.6.1.1.4.2.5.1.1.4 has a stray ',;' after the link; the parallel A.6.1.1.3.2.6.1.1.4 uses a plain comma. |
| 121 | A.6.1.1.4.2.5.2.4.1.2.6 Integration Boost Data Submission Responsible Actor | structural | Real, re-filed | re-filed as `placeholder` | The value is a garbled repeat that names no actor; sibling Integration Boost Instances (e.g. A.6.1.1.4.2.5.2.2.1.1.6) name Core Council Risk Advisor. |
| 122 | A.6.1.1.5.2.6.1.2.1.1.3.1.3 Ethereum Mainnet USDC ALM Proxy | grammar | Real | kept | In A.6.1.1.5.2.6.1.2.1.1.3.1.3 the singular subject 'The maximum amount' takes the plural 'are located'. |
| 123 | A.6.1.1.5.2.6.1.2.2.1.1 Role Hierarchy And Permissions | grammar | Real | kept | A.6.1.1.5.2.6.1.2.2.1.1 pairs 'documents' with 'defines'; Keel's and Pattern's copies use 'define', though Spark's A.6.1.1.1.2.6.1.2.2.1.1 has the same slip. |
| 124 | A.6.1.1.6.2.6.1.2.2.3.4 USDS Burn Action | grammar | Real | kept | A.6.1.1.6.2.6.1.2.2.3.4 drops the leading 'For'; sibling A.6.1.1.6.2.6.1.2.2.3.5 reads 'For more detailed instructions … see'. |
| 125 | NR-18 Conflicting Atlas Edit Proposals | grammar | Real | kept | In NR-18 the singular subject 'the Core Facilitator' takes the plural 'merge' in an indicative 'If' clause; it should be 'merges'. |

---

## Rejected, re-filed or changed — evidence

### 5. A.1.2.2.2.3 The Scope Type — real, re-filed

Sweep id `A.1.2.2.2.3#structural` (`69dc9b57-ad4d-4d84-9775-cc5338c43820`), factual pass, category `structural`. A.1.2.2.2.3 says six Scope documents (A.1 to A.6) and then '5 Atlas Scopes' in the next sentence; the count is wrong, a numeric defect rather than a structural one.

The Scope Type · A.1.2.2.2.3:

> each of the 5 Atlas Scopes

The Scope Type · A.1.2.2.2.3:

> Scope Documents have the Document Identifiers from A.1 to A.6.

**Action:** re-filed as `numeric`.

### 7. A.1.2.2.2.29 The Scenario Variation Type — real

Sweep id `A.1.2.2.2.29#typo` (`935bd219-df68-4466-99fe-0f9c5b328032`), language pass, category `typo`. A.1.2.2.2.29 has a stray space between the closing backtick of the example identifier and the sentence period. The defect is real but cosmetic.

The Scenario Variation Type · A.1.2.2.2.29:

> would have the following identifier: `A.1.1.0.4.1.1.1.var2` .

**Action:** kept, severity low.

### 8. A.1.5.10.2.0.6.1 Derecognized Alignment Conservers — real, re-filed

Sweep id `A.1.5.10.2.0.6.1#stale` (`e7aec672-ed19-4329-aaf7-736950be2eb7`), factual pass, category `stale`. In A.1.5.10.2.0.6.1 the 0xDefensor row is dated 2023-02-02, but its reasoning post's slug says 02-02-2024 and the row sits between 2023-10-30 and 2024-04-06 rows. It is a wrong year, not stale data.

Derecognized Alignment Conservers · A.1.5.10.2.0.6.1:

> | 2023-02-02 | AD | 0xDefensor | - |

Derecognized Alignment Conservers · A.1.5.10.2.0.6.1:

> ad-derecognition-due-to-operational-security-breach-02-02-2024/23619

Corrected fix: `Change the 0xDefensor row's date from 2023-02-02 to 2024-02-02.`

**Action:** re-filed as `numeric`, fix corrected.

### 12. A.1.10.2.4.7.4.4 Lindy-Based Risk Aversion — duplicate

Sweep id `A.1.10.2.4.7.4.4#typo-2` (`aa0a8049-f883-4366-9924-6651aeec14e6`), deterministic pass, category `typo`. A.1.10.2.4.7.4.4 has 'elements,and' with no space after the comma.

Lindy-Based Risk Aversion · A.1.10.2.4.7.4.4:

> systems, elements,and smart contracts

Corrected fix: `Replace 'elements,and' with 'elements, and'.`

**Action:** rejected (duplicate of `A.1.10.2.4.7.4.4#typo`).

### 15. A.1.10.2.4.11.1.6 Governance Point Validates Executive Document — real

Sweep id `A.1.10.2.4.11.1.6#markdown` (`12ebd0d9-52dc-4d1f-8e1a-8bdc2a51b9b0`), language pass, category `markdown`. In A.1.10.2.4.11.1.6 the opening '(' is itself a leftover link to vote.makerdao.com. The stored fix drops the surrounding parentheses, so the fix keeps them and removes only the stale link.

Governance Point Validates Executive Document · A.1.10.2.4.11.1.6:

> Executive Validator [(](https://vote.makerdao.com/executive/create)[https://vote.sky.money/executive/create](https://vote.sky.money/executive/create)).

Corrected fix: `Executive Validator ([https://vote.sky.money/executive/create](https://vote.sky.money/executive/create)).`

**Action:** kept, fix corrected.

### 17. A.1.14.2.9.2 Role Of Executor Agent Artifacts — real

Sweep id `A.1.14.2.9.2#typo` (`1405d49c-8373-409e-a96b-e59f49e3aeb0`), language pass, category `typo`. The single sentence in A.1.14.2.9.2 ends without terminal punctuation. The defect is real but minor.

Role Of Executor Agent Artifacts · A.1.14.2.9.2:

> including risk-management and fees

**Action:** kept, severity low.

### 18. A.2.2.1.1.3.2 Founder Access — real

Sweep id `A.2.2.1.1.3.2#markdown` (`a4f65994-2526-4522-a986-cd444a5cb896`), language pass, category `markdown`. A.2.2.1.1.3.2 opens with '_"_', which italicises only the opening quote mark. It is a stray-markup glitch, and the same term appears later in plain quotes.

Founder Access · A.2.2.1.1.3.2:

> _"_Founder Access" gives the Founder of an Agent

Founder Access · A.2.2.1.1.3.2:

> "Founder Access" is revoked at the moment

**Action:** kept, severity medium.

### 22. A.2.2.9.1.2.4.1.4.1.1.2 Document Update Triggers — false positive

Sweep id `A.2.2.9.1.2.4.1.4.1.1.2#markdown` (`c298f200-2ac8-4fc3-9d02-e05f4cf2f42f`), deterministic pass, category `markdown`. A.2.2.9.1.2.4.1.4.1.1.2 has two adjacent bold spans (bold code, then bold text) separated by a space, not empty bold markers; it renders correctly.

Document Update Triggers · A.2.2.9.1.2.4.1.4.1.1.2:

> **`Sky Core Distribution Reward Reimbursement`** **Active Data Document Update**

**Action:** rejected.

### 26. A.2.8.2.1.2.4.1 DeFi Opportunities Right of First Refusal Duration — real

Sweep id `A.2.8.2.1.2.4.1#markdown` (`0db1525d-bcce-469a-b414-65b41669432d`), language pass, category `markdown`. In A.2.8.2.1.2.4.1, '_Example:__' has an extra underscore. The paragraph closes with 'four weeks._', and the stored fix would leave that final underscore unmatched.

DeFi Opportunities Right of First Refusal Duration · A.2.8.2.1.2.4.1:

> _Example:__ A lending protocol (i.e. Aave, Euler, Morpho, etc) plans on deploying on blockchain X.

DeFi Opportunities Right of First Refusal Duration · A.2.8.2.1.2.4.1:

> the opportunity reverts to Grove after four weeks._

Corrected fix: `_Example:_ _A lending protocol (i.e. Aave, Euler, Morpho, etc) plans on deploying on blockchain X.`

**Action:** kept, fix corrected.

### 27. A.2.8.2.2.2.7.4 Treatment of Expenses Paid By Sky Pre-TGE — false positive

Sweep id `A.2.8.2.2.2.7.4#stale` (`f3672ca1-b305-4e16-86f0-3dc3267073bb`), factual pass, category `stale`. The 'after July 1, 2025' window is intentional: A.2.8.2.2.2.7.5 credits income from July 1 until TGE net of A.2.8.2.2.2.7.4 expenses, and the Spark 2m/2.4m advances are authorized by their own children .4.1/.4.2.

Income Generation And Pre-TGE Credit · A.2.8.2.2.2.7.5:

> "Income Generation" shall be deemed to commence on July 1, 2025. From that date until the Prime

Transfer From Liquidity Bootstrapping Budget To Spark For Market Makers · A.2.8.2.2.2.7.4.1:

> This amount shall be treated as an advance against Spark

**Action:** rejected.

### 29. A.2.9.1.1.1.4.2.2.1 Resilience Fund Claim Approval Payout Claim — real

Sweep id `A.2.9.1.1.1.4.2.2.1#grammar` (`d47f9aa8-96d1-4be7-910c-505693b1784a`), language pass, category `grammar`. In A.2.9.1.1.1.4.2.2.1 a sentence break is missing after 'Governmental Agency'. The fix is narrowed to the punctuation only, because the word change belongs to n=30.

Resilience Fund Claim Approval Payout Claim · A.2.9.1.1.1.4.2.2.1:

> issued by a Court or Governmental Agency Supportive documentation is highly sensible.

Corrected fix: `issued by a Court or Governmental Agency. Supportive documentation is highly sensible.`

**Action:** kept, fix corrected.

### 36. A.3.2.2.1.1.1.1.1.4 Calculate Capital Requirement Without Buffers — real

Sweep id `A.3.2.2.1.1.1.1.1.4#structural` (`152bc5d8-7642-424c-b5fc-9242479f705e`), factual pass, category `structural`. K is the Sensitivity Factor (=10) in A.3.2.2.1.1.1.1.1.3.3 and is reused as the Capital Requirement Without Buffers in A.3.2.2.1.1.1.1.1.4, which A.3.2.2.1.1.1.1.1.5 then multiplies into RRC.

Sensitivity Coefficient · A.3.2.2.1.1.1.1.1.3.3:

> The Sensitivity Factor `K` is a tuning parameter

Calculate Capital Requirement Without Buffers · A.3.2.2.1.1.1.1.1.4:

> The fourth step is to calculate the Capital Requirement Without Buffers $K$.

Calculate Required Risk Capital · A.3.2.2.1.1.1.1.1.5:

> \text{RRC} = K \times \frac{1}{CR} \times \text{EAD} \times \text{ECR}

**Action:** kept, severity medium.

### 44. A.3.2.2.1.2.4.2.2.2 Effective Age — real

Sweep id `A.3.2.2.1.2.4.2.2.2#numeric` (`c06bbc44-09c0-43f9-b443-39c2802a4a78`), factual pass, category `numeric`. The referenced AGEeff is contract age in months times a log factor (A.3.2.2.1.2.2.4.3, .4.3.1). A.3.2.2.1.2.4.2.2 uses it as a 0-1 weight, and A.3.2.2.1.2.4.2.2.2 caps it in years, so units and scale do not match.

Effective Age · A.3.2.2.1.2.4.2.2.2:

> except that the Effective Age cannot exceed one (1) year.

Contract Age · A.3.2.2.1.2.2.4.3.1:

> is the average age, in months, of each of the relevant contracts

Exposure Calculation · A.3.2.2.1.2.4.2.2:

> `Exposure = Equivalent Loss * Effective Age + Raw Exposure * (1 - Effective Age)`

**Action:** kept, severity medium.

### 52. A.6.1.1.*.2.2.1.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.2.1.1.4#structural-a6112212`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.2.1.1.4 sends completed Invocations to the container A.6.1.1.3.2.2.1.2; Spark A.6.1.1.1.2.2.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.2.1.1.4:

> [A.6.1.1.3.2.2.1.2 - Active Instances](e1eb3283-ac9c-490e-bd36-850dd8bd71bd)

In Progress Invocations Directory · A.6.1.1.1.2.2.1.1.4:

> moved to [A.6.1.1.1.2.2.1.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.2.1.1.4 replace [A.6.1.1.3.2.2.1.2 - Active Instances](e1eb3283-ac9c-490e-bd36-850dd8bd71bd) with [A.6.1.1.3.2.2.1.1.2 - Active Instances Directory](67640351-2db1-4252-a1cb-5c28aa02a56e).`

**Action:** kept, severity medium, fix corrected.

### 53. A.6.1.1.*.2.2.3.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.2.3.1.4#structural-a6112232`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.2.3.1.4 sends completed Invocations to the container A.6.1.1.3.2.2.3.2; Spark A.6.1.1.1.2.2.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.2.3.1.4:

> [A.6.1.1.3.2.2.3.2 - Active Instances](7acfe8a6-80a2-4074-a6d0-fad968c95d1c)

In Progress Invocations Directory · A.6.1.1.1.2.2.3.1.4:

> moved to [A.6.1.1.1.2.2.3.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.2.3.1.4 replace [A.6.1.1.3.2.2.3.2 - Active Instances](7acfe8a6-80a2-4074-a6d0-fad968c95d1c) with [A.6.1.1.3.2.2.3.1.2 - Active Instances Directory](e196d802-de22-410a-963a-c9d8359e9644).`

**Action:** kept, severity medium, fix corrected.

### 54. A.6.1.1.*.2.4.1.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.4.1.1.4#structural-a6112412`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.4.1.1.4 sends completed Invocations to the container A.6.1.1.3.2.4.1.2; Spark A.6.1.1.1.2.4.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.4.1.1.4:

> [A.6.1.1.3.2.4.1.2 - Active Instances](38756877-b767-4a71-9f38-630a96b50f5a)

In Progress Invocations Directory · A.6.1.1.1.2.4.1.1.4:

> moved to [A.6.1.1.1.2.4.1.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.4.1.1.4 replace [A.6.1.1.3.2.4.1.2 - Active Instances](38756877-b767-4a71-9f38-630a96b50f5a) with [A.6.1.1.3.2.4.1.1.2 - Active Instances Directory](9e793e15-c1b3-41e9-a9ea-5cdd034aa27f).`

**Action:** kept, severity medium, fix corrected.

### 55. A.6.1.1.*.2.5.1.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.5.1.1.4#structural-a6112512`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.5.1.1.4 sends completed Invocations to the container A.6.1.1.3.2.5.1.2; Spark A.6.1.1.1.2.5.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.5.1.1.4:

> [A.6.1.1.3.2.5.1.2 - Active Instances](4da74767-8e45-420c-9477-89b810654ab4)

In Progress Invocations Directory · A.6.1.1.1.2.5.1.1.4:

> moved to [A.6.1.1.1.2.5.1.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.5.1.1.4 replace [A.6.1.1.3.2.5.1.2 - Active Instances](4da74767-8e45-420c-9477-89b810654ab4) with [A.6.1.1.3.2.5.1.1.2 - Active Instances Directory](cc24f926-2163-46e6-a480-8d6365911553).`

**Action:** kept, severity medium, fix corrected.

### 56. A.6.1.1.*.2.5.2.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.5.2.1.4#structural-a6112522`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.5.2.1.4 sends completed Invocations to the container A.6.1.1.3.2.5.2.2; Spark A.6.1.1.1.2.5.2.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.5.2.1.4:

> [A.6.1.1.3.2.5.2.2 - Active Instances](a53d1d40-f944-4cf2-9941-8e6f0ec77a72)

In Progress Invocations Directory · A.6.1.1.1.2.5.2.1.4:

> moved to [A.6.1.1.1.2.5.2.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.5.2.1.4 replace [A.6.1.1.3.2.5.2.2 - Active Instances](a53d1d40-f944-4cf2-9941-8e6f0ec77a72) with [A.6.1.1.3.2.5.2.1.2 - Active Instances Directory](bc7296ae-4bfb-4318-87fb-44869a7932c1).`

**Action:** kept, severity medium, fix corrected.

### 57. A.6.1.1.*.2.5.3.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.5.3.1.4#structural-a6112532`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.5.3.1.4 sends completed Invocations to the container A.6.1.1.3.2.5.3.2; Spark A.6.1.1.1.2.5.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.5.3.1.4:

> [A.6.1.1.3.2.5.3.2 - Active Instances](5d043c09-1d78-456d-b356-c72a13fe46c8)

In Progress Invocations Directory · A.6.1.1.1.2.5.3.1.4:

> moved to [A.6.1.1.1.2.5.3.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.5.3.1.4 replace [A.6.1.1.3.2.5.3.2 - Active Instances](5d043c09-1d78-456d-b356-c72a13fe46c8) with [A.6.1.1.3.2.5.3.1.2 - Active Instances Directory](0596e4e7-880f-42ce-96b8-00e8482837fb).`

**Action:** kept, severity medium, fix corrected.

### 58. A.6.1.1.*.2.6.1.2.2.3.2.1 (corpus-wide) — false positive

Sweep id `A.6.1.1.*.2.6.1.2.2.3.2.1#structural-call`, deterministic pass, category `structural`. All four ERC-4626 Withdrawal Action docs direct the same call, redeemERC4626(address(token), token.balanceOf(address(proxy))); only the wording (execute action vs call function) differs.

ERC-4626 Withdrawal Action · A.6.1.1.1.2.6.1.2.2.3.2.1:

> foreignController.redeemERC4626(address(token), token.balanceOf(address(proxy)))

ERC-4626 Withdrawal Action · A.6.1.1.2.2.6.1.2.2.3.2.1:

> mainnetController.redeemERC4626(address(token), token.balanceOf(address(proxy)))

ERC-4626 Withdrawal Action · A.6.1.1.5.2.6.1.2.2.3.2.1:

> In order to withdraw all ERC-4626 balances, the operator must call the `redeemERC4626` function.

**Action:** rejected.

### 59. A.6.1.1.*.2.6.2.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.6.2.1.4#structural-a6112622`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.6.2.1.4 sends completed Invocations to the container A.6.1.1.3.2.6.2.2; Spark A.6.1.1.1.2.6.2.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.6.2.1.4:

> [A.6.1.1.3.2.6.2.2 - Active Instances](ee196317-63fc-4f69-a985-2a4f5a5be4e5)

In Progress Invocations Directory · A.6.1.1.1.2.6.2.1.4:

> moved to [A.6.1.1.1.2.6.2.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.6.2.1.4 replace [A.6.1.1.3.2.6.2.2 - Active Instances](ee196317-63fc-4f69-a985-2a4f5a5be4e5) with [A.6.1.1.3.2.6.2.1.2 - Active Instances Directory](9264bed6-21a2-4e39-8546-0ab157380740).`

**Action:** kept, severity medium, fix corrected.

### 60. A.6.1.1.*.2.6.3.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.6.3.1.4#structural-a6112632`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.6.3.1.4 sends completed Invocations to the container A.6.1.1.3.2.6.3.2; Spark A.6.1.1.1.2.6.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.6.3.1.4:

> [A.6.1.1.3.2.6.3.2 - Active Instances](537fef57-4e7f-49d7-ac58-b23ed98aff7c)

In Progress Invocations Directory · A.6.1.1.1.2.6.3.1.4:

> moved to [A.6.1.1.1.2.6.3.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.6.3.1.4 replace [A.6.1.1.3.2.6.3.2 - Active Instances](537fef57-4e7f-49d7-ac58-b23ed98aff7c) with [A.6.1.1.3.2.6.3.1.2 - Active Instances Directory](7b21f5bd-68dd-4cf6-8048-cb5eef547b47).`

**Action:** kept, severity medium, fix corrected.

### 61. A.6.1.1.*.2.7.1.1.4 (corpus-wide) — real

Sweep id `A.6.1.1.*.2.7.1.1.4#structural-a6112712`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.7.1.1.4 sends completed Invocations to the container A.6.1.1.3.2.7.1.2; Spark A.6.1.1.1.2.7.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 point to the Active Instances Directory.

In Progress Invocations Directory · A.6.1.1.3.2.7.1.1.4:

> [A.6.1.1.3.2.7.1.2 - Active Instances](0b4cc335-c2ed-4b7f-8cb5-eeb1bab394b8)

In Progress Invocations Directory · A.6.1.1.1.2.7.1.1.4:

> moved to [A.6.1.1.1.2.7.1.1.2 - Active Instances Directory]

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> [A.6.1.1.3.2.6.1.1.2 - Active Instances Directory](134c14e9-28ed-4e18-b15a-26899644dc0b)

Corrected fix: `In A.6.1.1.3.2.7.1.1.4 replace [A.6.1.1.3.2.7.1.2 - Active Instances](0b4cc335-c2ed-4b7f-8cb5-eeb1bab394b8) with [A.6.1.1.3.2.7.1.1.2 - Active Instances Directory](11bc952d-781a-439b-9760-83a007fb9dd2).`

**Action:** kept, severity medium, fix corrected.

### 63. A.6.1.1.1.2.5.2.1.4 In Progress Invocations Directory — real, re-filed

Sweep id `A.6.1.1.1.2.5.2.1.4#markdown` (`786859ec-1f50-4343-8bed-82ef86781356`), language pass, category `markdown`. A.6.1.1.1.2.5.2.1.4 has the doubled punctuation ',;' after the link. This is a punctuation typo, not a markdown error, and the fix to ', whereas' is correct.

In Progress Invocations Directory · A.6.1.1.1.2.5.2.1.4:

> Active Instances Directory](bb23a141-5119-4473-be3a-8f3c2a6f181a),; whereas failed Invocations are Archived

**Action:** re-filed as `typo`.

### 74. A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.3 Withdraw Aave ATokens — real

Sweep id `A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.3#duplication` (`35cf8ecc-ce16-4498-81f5-d96073ec5724`), factual pass, category `duplication`. A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.3 has the same title, body and link as its sibling .2.2.2.2.2; the stored fix is empty.

Withdraw Aave ATokens · A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.3:

> This document defines the steps to withdraw a yield-earning balance from the Aave AToken vaults to the ALM Proxy.

Withdraw Aave ATokens · A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.2:

> This document defines the steps to withdraw a yield-earning balance from the Aave AToken vaults to the ALM Proxy.

Corrected fix: `Delete A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.3 (verbatim duplicate of A.6.1.1.1.2.6.1.2.2.1.2.2.2.2.2).`

**Action:** kept, fix corrected.

### 75. A.6.1.1.1.2.6.1.2.2.1.3 Rate Limit Management — real

Sweep id `A.6.1.1.1.2.6.1.2.2.1.3#naming` (`554a654f-930a-419e-a8a4-f49dd5599ee8`), language pass, category `naming`. A.6.1.1.1.2.6.1.2.2.1.3 writes the term as `RateLimits` in one sentence and as plain 'ratelimits' in the next; fix should keep the backtick form.

Rate Limit Management · A.6.1.1.1.2.6.1.2.2.1.3:

> adjusting `RateLimits` for Instances using their `RateLimitID`s. The ratelimits must be maintained

Corrected fix: `The 'RateLimits' must be maintained in line with Spark’s strategy, market conditions, and security considerations.`

**Action:** kept, severity medium, fix corrected.

### 83. A.6.1.1.1.3.2.1.1.3.2.5 SparkLend Cap Automator sDai Parameters — real

Sweep id `A.6.1.1.1.3.2.1.1.3.2.5#naming` (`21bdfe50-0996-494d-8413-1d41966fb4f6`), language pass, category `naming`. A.6.1.1.1.3.2.1.1.3.2.5 writes the asset as 'sDai' (title, supply cap) but as 'sDAI' in the borrow-cap max line.

SparkLend Cap Automator sDai Parameters · A.6.1.1.1.3.2.1.1.3.2.5:

> `max`: 1 billion sDai

SparkLend Cap Automator sDai Parameters · A.6.1.1.1.3.2.1.1.3.2.5:

> `max`: 0 sDAI

**Action:** kept, severity medium.

### 86. A.6.1.1.1.3.4.2.1.1 Definition — real, re-filed

Sweep id `A.6.1.1.1.3.4.2.1.1#xref` (`f426cc6e-336a-43bf-825d-1f0c08d1795e`), factual pass, category `xref`. The links are correct, but the term is not: A.6.1.1.1.3.4.2.1.1 says 'Target Risk Tolerance Ratio' and .2.2.2 says 'Risk Tolerance Ratio', while the cited .2.1.3 defines only 'Target Encumbrance Ratio'.

Definition · A.6.1.1.1.3.4.2.1.1:

> not greater than the Target Risk Tolerance Ratio specified in

Parameters · A.6.1.1.1.3.4.2.1.3:

> The current Target Encumbrance Ratio is 90%.

Evaluation Method · A.6.1.1.1.3.4.2.2.2:

> divided by Risk Tolerance Ratio

**Action:** re-filed as `naming`.

### 87. A.6.1.1.1.3.5.3.2.3.2 Spark Savings USDT on Ethereum — real

Sweep id `A.6.1.1.1.3.5.3.2.3.2#xref` (`087dc001-1a44-4096-acd1-feeb109f7ec0`), factual pass, category `xref`. A.6.1.1.1.3.5.3.2.3.2 labels its link 'Onchain Parameters', but the target A.6.1.1.1.3.5.2.2.2 is titled 'Spark Savings USDT on Ethereum'; the UUID itself is correct.

Spark Savings USDT on Ethereum · A.6.1.1.1.3.5.3.2.3.2:

> [A.6.1.1.1.3.5.2.2.2 - Onchain Parameters](39a398d7-600e-472a-ac85-c789866fddfc)

Spark Savings USDT on Ethereum · A.6.1.1.1.3.5.2.2.2:

> Spark Savings USDT on Ethereum

**Action:** kept, severity medium.

### 88. A.6.1.1.1.3.5.3.2.3.6 Spark Savings USDG on Robinhood Chain — real

Sweep id `A.6.1.1.1.3.5.3.2.3.6#xref` (`ad064b08-8866-4c14-ad34-1275101032a5`), factual pass, category `xref`. A.6.1.1.1.3.5.3.2.3.6 labels its link 'Onchain Parameters', but the target A.6.1.1.1.3.5.2.2.6 is titled 'Spark Savings USDG on Robinhood Chain'; the UUID is correct.

Spark Savings USDG on Robinhood Chain · A.6.1.1.1.3.5.3.2.3.6:

> [A.6.1.1.1.3.5.2.2.6 - Onchain Parameters](398944f7-59c3-495c-900b-939358b76e68)

Spark Savings USDG on Robinhood Chain · A.6.1.1.1.3.5.2.2.6:

> Spark Savings USDG on Robinhood Chain

**Action:** kept, severity medium.

### 89. A.6.1.1.1.3.5.3.2.3.7 Spark Savings USDT on Arbitrum — false positive

Sweep id `A.6.1.1.1.3.5.3.2.3.7#xref` (`2df1f51c-308f-4b29-90a7-7c01c35e891c`), deterministic pass, category `xref`. The link resolves to the right doc (A.6.1.1.1.3.5.3.2.2 'Operational Process'); the label just prefixes the parent title A.6.1.1.1.3.5.3.2 'Rewards Rate', the same pattern every sibling uses.

Spark Savings USDT on Arbitrum · A.6.1.1.1.3.5.3.2.3.7:

> [A.6.1.1.1.3.5.3.2.2 - Rewards Rate Operational Process](6c7a4964-485f-4edf-a05f-61fa65c9871c)

Rewards Rate · A.6.1.1.1.3.5.3.2:

> Rewards Rate

**Action:** rejected.

### 90. A.6.1.1.1.3.5.3.2.3.7 Spark Savings USDT on Arbitrum — real

Sweep id `A.6.1.1.1.3.5.3.2.3.7#xref-2` (`2df1f51c-308f-4b29-90a7-7c01c35e891c`), deterministic pass, category `xref`. The link to A.6.1.1.1.3.5.2.2.7 ('Spark Savings USDT on Arbitrum') carries the A.6.1.1.1.3.5.2 section title 'Onchain Parameters'; target correct; siblings .3.2/.3.6/.3.8/.3.9 repeat it.

Spark Savings USDT on Arbitrum · A.6.1.1.1.3.5.3.2.3.7:

> [A.6.1.1.1.3.5.2.2.7 - Onchain Parameters](5a2b0ec2-5358-4464-b6cb-0d39642a437d)

Spark Savings USDT on Arbitrum · A.6.1.1.1.3.5.2.2.7:

> The current parameters for Spark Savings USDT on Arbitrum are:

Onchain Parameters · A.6.1.1.1.3.5.2:

> Onchain Parameters

Corrected fix: `Relabel to [A.6.1.1.1.3.5.2.2.7 - Spark Savings USDT on Arbitrum](5a2b0ec2-5358-4464-b6cb-0d39642a437d) (same pattern in A.6.1.1.1.3.5.3.2.3.2/.6/.8/.9).`

**Action:** kept, severity low, fix corrected.

### 91. A.6.1.1.1.3.5.3.2.3.7 Spark Savings USDT on Arbitrum — false positive

Sweep id `A.6.1.1.1.3.5.3.2.3.7#xref-3` (`2df1f51c-308f-4b29-90a7-7c01c35e891c`), deterministic pass, category `xref`. The link resolves to the right doc (A.6.1.1.1.3.5.3.2.1 'Definition'); the label just prefixes the parent title 'Rewards Rate' (A.6.1.1.1.3.5.3.2), the same pattern every sibling uses.

Spark Savings USDT on Arbitrum · A.6.1.1.1.3.5.3.2.3.7:

> [A.6.1.1.1.3.5.3.2.1 - Rewards Rate Definition](3a143911-80c9-4eb0-9aa3-5b3d3a8ca843)

Definition · A.6.1.1.1.3.5.3.2.1:

> The Spark Savings Rewards Rate specifies the yield paid out to depositors

**Action:** rejected.

### 92. A.6.1.1.1.3.5.3.2.3.8 Spark Savings USDT on X Layer — real

Sweep id `A.6.1.1.1.3.5.3.2.3.8#xref` (`40f91471-6b4c-4058-8917-d3b6d2a87f38`), factual pass, category `xref`. A.6.1.1.1.3.5.3.2.3.8 labels its link 'Onchain Parameters', but the target A.6.1.1.1.3.5.2.2.8 is titled 'Spark Savings USDT on X Layer'; the UUID is correct.

Spark Savings USDT on X Layer · A.6.1.1.1.3.5.3.2.3.8:

> [A.6.1.1.1.3.5.2.2.8 - Onchain Parameters](c6eb9203-a5af-4f9b-baaf-b70c4449d4a4)

Spark Savings USDT on X Layer · A.6.1.1.1.3.5.2.2.8:

> Spark Savings USDT on X Layer

**Action:** kept, severity medium.

### 95. A.6.1.1.2.2.3.2 Upkeep Rebate Primitive — real

Sweep id `A.6.1.1.2.2.3.2#grammar` (`ef8a7a1d-4e4d-474b-97fd-801c8285e9fc`), language pass, category `grammar`. A.6.1.1.2.2.3.2 says 'Groves Instance'; siblings like A.6.1.1.2.2.1.1 use 'Grove’s Instance' (curly apostrophe, so the fix should use ’).

Upkeep Rebate Primitive · A.6.1.1.2.2.3.2:

> for Groves Instance of the Upkeep Rebate Primitive

Agent Creation Primitive · A.6.1.1.2.2.1.1:

> for Grove’s Instance of the Agent Creation Primitive

Corrected fix: `The documents herein contain all data and specifications for Grove’s Instance of the Upkeep Rebate Primitive.`

**Action:** kept, fix corrected.

### 96. A.6.1.1.2.2.5.1.1 Primitive Hub Document — real

Sweep id `A.6.1.1.2.2.5.1.1#grammar` (`21b5e889-c9f9-45e7-becb-fde3e070e063`), language pass, category `grammar`. A.6.1.1.2.2.5.1.1 says 'Groves usage'; sibling hub docs like A.6.1.1.2.2.1.1.1 use 'Grove’s usage' (curly apostrophe).

Primitive Hub Document · A.6.1.1.2.2.5.1.1:

> relevant to Groves usage of the Distribution Reward Primitive

Primitive Hub Document · A.6.1.1.2.2.1.1.1:

> relevant to Grove’s usage of the Agent Creation Primitive

Corrected fix: `The documents herein organize all base information relevant to Grove’s usage of the Distribution Reward Primitive.`

**Action:** kept, fix corrected.

### 97. A.6.1.1.2.2.5.2.1.4 In Progress Invocations Directory — real, re-filed

Sweep id `A.6.1.1.2.2.5.2.1.4#markdown` (`83d45b11-4497-473b-b3c4-80c0543dd5dd`), language pass, category `markdown`. A.6.1.1.2.2.5.2.1.4 has a visible stray space before the final period; this is a punctuation slip, not broken markdown. Siblings like A.6.1.1.2.2.5.1.1.4 have none.

In Progress Invocations Directory · A.6.1.1.2.2.5.2.1.4:

> [A.6.1.1.2.2.5.2.1.5 - Hub Data Repository](732e99b3-3a0c-4116-b3f6-5b9d2ad4d351) .

In Progress Invocations Directory · A.6.1.1.2.2.5.1.1.4:

> [A.6.1.1.2.2.5.1.1.5 - Hub Data Repository](8ea4b4ad-e167-4772-b7d6-0c87357a10e8).

**Action:** re-filed as `typo`, severity medium.

### 98. A.6.1.1.2.2.6.1.2.1.2.1 Invoking New Instances — real

Sweep id `A.6.1.1.2.2.6.1.2.1.2.1#grammar` (`edf44383-44e6-4aaa-972a-7dfdaee0998d`), language pass, category `grammar`. A.6.1.1.2.2.6.1.2.1.2.1 runs 'process see [' together with no punctuation; the same boilerplate repeats in the Spark and Keel siblings (A.6.1.1.1.2.6.1.2.1.2.1).

Invoking New Instances · A.6.1.1.2.2.6.1.2.1.2.1:

> follows the Root Edit process see [A.6.1.1.2.2.2.2.2.1.2 - Operational Process Definition]

Invoking New Instances · A.6.1.1.1.2.6.1.2.1.2.1:

> follows the Root Edit process see [

**Action:** kept, severity medium.

### 100. A.6.1.1.2.2.6.1.3.1.4.1.3.1.1 Addresses Of Delegated Signers — real

Sweep id `A.6.1.1.2.2.6.1.3.1.4.1.3.1.1#entity` (`ba1c514f-026a-4ecd-bb9a-c736cca59728`), factual pass, category `entity`. A.6.1.1.2.2.6.1.3.1.4.1.3.1.1 is in the Grove Artifact but defers to 'the Spark Artifact'; every other deferral under A.6.1.1.2 says 'Grove Artifact' (e.g. .4.1.2.3). It also misspells 'addesses'.

Addresses Of Delegated Signers · A.6.1.1.2.2.6.1.3.1.4.1.3.1.1:

> These addesses will be specified in a future iteration of the Spark Artifact.

Rate Limit IDs · A.6.1.1.2.2.6.1.3.1.4.1.2.3:

> will be specified in a future iteration of the Grove Artifact.

Corrected fix: `Change 'These addesses will be specified in a future iteration of the Spark Artifact.' to 'These addresses will be specified in a future iteration of the Grove Artifact.'`

**Action:** kept, fix corrected.

### 102. A.6.1.1.2.2.6.1.3.1.4.3.2.2.1 Token Address — real

Sweep id `A.6.1.1.2.2.6.1.3.1.4.3.2.2.1#entity` (`9008b149-de3d-429d-824f-48524063d657`), factual pass, category `entity`. PT-USDe Instance (Token: PT-USDe, A.6.1.1.2.2.6.1.3.1.4.3.2.1.4) gives the USDe Token Address of A.6.1.1.2.2.6.1.3.1.4.1.2.2.1; it also differs from sibling PT-sUSDe, which uses the supplied USDC.

Token Address · A.6.1.1.2.2.6.1.3.1.4.3.2.2.1:

> 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3

Token · A.6.1.1.2.2.6.1.3.1.4.3.2.1.4:

> PT-USDe

Token Address · A.6.1.1.2.2.6.1.3.1.4.1.2.2.1:

> 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3

**Action:** kept, severity medium.

### 103. A.6.1.1.2.2.6.1.3.1.4.4.2.2.1 Token Address — real

Sweep id `A.6.1.1.2.2.6.1.3.1.4.4.2.2.1#entity` (`3b108b97-6f88-4d96-a55a-38c39191281e`), factual pass, category `entity`. PT-sUSDe Token Address equals its USDC Underlying Asset Address; off-chain Paxos ICDs use that Token=Underlying pattern, but this ICD names Token: PT-sUSDe and sibling PT-USDe uses a non-USDC address.

Token Address · A.6.1.1.2.2.6.1.3.1.4.4.2.2.1:

> 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48

Underlying Asset Address · A.6.1.1.2.2.6.1.3.1.4.4.2.2.2:

> 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48

Token · A.6.1.1.2.2.6.1.3.1.4.4.2.1.4:

> PT-sUSDe

**Action:** kept, severity low.

### 106. A.6.1.1.2.2.6.1.3.1.15.1.2.2.1 Token Address — false positive

Sweep id `A.6.1.1.2.2.6.1.3.1.15.1.2.2.1#entity` (`60a0bddf-ade3-4be9-8142-06880cec308d`), factual pass, category `entity`. Every Paxos conversion ICD sets Token Address = Underlying = supplied asset, not Token to Receive (e.g. Spark USDC To PYUSD A.6.1.1.1.2.6.1.3.1.7.1.2.2.1 uses USDC), so USDC here follows the convention.

Token Address · A.6.1.1.1.2.6.1.3.1.7.1.2.2.1:

> 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48

Token to Receive · A.6.1.1.1.2.6.1.3.1.7.1.2.1.4:

> PYUSD

Asset Supplied By Grove Liquidity Layer · A.6.1.1.2.2.6.1.3.1.15.1.2.1.3:

> USDC

**Action:** rejected.

### 107. A.6.1.1.2.2.6.1.3.7.1.1.2.5.1 Maximum Exposure — false positive

Sweep id `A.6.1.1.2.2.6.1.3.7.1.1.2.5.1#numeric` (`689ed5dc-1843-4a75-bc7a-a4147caa062e`), factual pass, category `numeric`. Maximum Exposure caps are stated in USDS house-wide regardless of asset (e.g. ACRDX exposure in USDS at A.6.1.1.2.2.6.1.3.1.1.3.2.5.1), so a USDS-denominated USDG cap is consistent.

Maximum Exposure · A.6.1.1.2.2.6.1.3.7.1.1.2.5.1:

> Total USDG exposure may not exceed 100 million USDS.

Maximum Exposure · A.6.1.1.2.2.6.1.3.1.1.3.2.5.1:

> Total ACRDX exposure may not exceed 50.97 million USDS

**Action:** rejected.

### 108. A.6.1.1.2.2.6.3 Asset Liability Management Rental Primitive — real

Sweep id `A.6.1.1.2.2.6.3#typo` (`0ec0b58d-9332-49ba-bdf8-8e0201480d1d`), language pass, category `typo`. A.6.1.1.2.2.6.3 has 'Groves Instances' where sibling docs like A.6.1.1.2.2.6.2 use 'Grove’s' (curly apostrophe); A.6.1.1.2.2.3.2 has the same slip.

Asset Liability Management Rental Primitive · A.6.1.1.2.2.6.3:

> all data and specifications for Groves Instances of the Asset Liability Management Rental Primitive

Risk Capital Rental Primitive · A.6.1.1.2.2.6.2:

> all data and specifications for Grove’s Instances of the Risk Capital Rental Primitive

Corrected fix: `The documents herein contain all data and specifications for Grove’s Instances of the Asset Liability Management Rental Primitive.`

**Action:** kept, fix corrected.

### 113. A.6.1.1.3.2.6.1.2.1.1.3.2.2.2 USDC For USDS Swap Maximum — duplicate

Sweep id `A.6.1.1.3.2.6.1.2.1.1.3.2.2.2#copy-paste` (`06081a43-075d-48c1-a26d-6578c1aa2fd3`), language pass, category `copy-paste`. A.6.1.1.3.2.6.1.2.1.1.3.2.2.2 is titled USDC For USDS but its body says 'swapped for USDC'; sibling .2.2.3 correctly names its target, USDT.

USDC For USDS Swap Maximum · A.6.1.1.3.2.6.1.2.1.1.3.2.2.2:

> The maximum amount of USDC that can be swapped for USDC by the Keel Liquidity Layer on Solana

USDC For USDT Swap Maximum · A.6.1.1.3.2.6.1.2.1.1.3.2.2.3:

> The maximum amount of USDC that can be swapped for USDT by the Keel Liquidity Layer on Solana

**Action:** rejected (duplicate of `A.6.1.1.3.2.6.1.2.1.1.3.2.2.2#wrong-word`).

### 115. A.6.1.1.3.2.6.1.2.1.2.2.1.2 Required Number Of Signers — real, re-filed

Sweep id `A.6.1.1.3.2.6.1.2.1.2.2.1.2#numeric` (`90059aef-0d59-4174-9076-e894ce9cf730`), factual pass, category `numeric`. A 1/2 threshold is not a majority of two signers, contradicting the Modification rule of the same multisig at A.6.1.1.3.2.6.1.2.1.2.2.1.5.

Required Number Of Signers · A.6.1.1.3.2.6.1.2.1.2.2.1.2:

> The Prime Relayer Multisig currently has a 1/2 signing requirement.

Modification · A.6.1.1.3.2.6.1.2.1.2.2.1.5:

> so long as there are at least two (2) signers and at least a majority of signers are required to execute transactions

**Action:** kept.

### 117. A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.6.2 Bridge USDS / sUSDS Using SkyBridge (LayerZero OFT) Token Bridge — real, re-filed

Sweep id `A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.6.2#entity` (`d239ba22-9a09-49f1-9fdc-a1d306ffe697`), factual pass, category `entity`. Title names SkyBridge (LayerZero OFT) but body says OP Token Bridge, copied verbatim from Spark's A.6.1.1.1.2.6.1.2.2.1.2.1.2.5.2.

Bridge USDS / sUSDS Using SkyBridge (LayerZero OFT) Token Bridge · A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.6.2:

> Bridge USDS / sUSDS Using SkyBridge (LayerZero OFT) Token Bridge

Bridge USDS / sUSDS Using SkyBridge (LayerZero OFT) Token Bridge · A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.6.2:

> bridge USDS or sUSDS using the OP Token Bridge

Bridge USDS / sUSDS Using OP Token Bridge · A.6.1.1.1.2.6.1.2.2.1.2.1.2.5.2:

> This document defines the process for an operator to bridge USDS or sUSDS using the OP Token Bridge.

**Action:** re-filed as `copy-paste`.

### 118. A.6.1.1.3.2.6.1.2.2.2.1.3.2.1 Get Rate Limit Data — real, re-filed

Sweep id `A.6.1.1.3.2.6.1.2.2.2.1.3.2.1#structural` (`c75e8c0d-0b16-4808-a14c-dac919ef9269`), factual pass, category `structural`. Under Integration Level Rate Limits (A.6.1.1.3.2.6.1.2.2.2.1.3.2), the text says 'Reserve level rate limit', copied from the Reserve-level doc A.6.1.1.3.2.6.1.2.2.2.1.3.1.1.

Get Rate Limit Data · A.6.1.1.3.2.6.1.2.2.2.1.3.2.1:

> The properties associated with a Reserve level rate limit can be read from the `Integration` account

Get Rate Limit Data · A.6.1.1.3.2.6.1.2.2.2.1.3.1.1:

> The properties associated with a Reserve level rate limit can be read from the `Reserve` account

**Action:** re-filed as `copy-paste`.

### 119. A.6.1.1.3.2.6.1.2.2.2.3.4 AtomicSwap Action — real, re-filed

Sweep id `A.6.1.1.3.2.6.1.2.2.2.3.4#entity` (`1bc17a00-a5b7-4390-bec5-46674053222b`), factual pass, category `entity`. Solana Emergency Protocol doc (parent A.6.1.1.3.2.6.1.2.2.2.3) carries the Mainnet swapUSDCToUSDS Solidity action copied from Mainnet emergency docs; the Solana AtomicSwap is A.6.1.1.3.2.6.1.2.2.2.1.2.1.2.3.

Emergency Protocol · A.6.1.1.3.2.6.1.2.2.2.3:

> within Keel Liquidity Layer operations on Solana

AtomicSwap Action · A.6.1.1.3.2.6.1.2.2.2.3.4:

> mainnetController.swapUSDCToUSDS(usdc.balanceOf(address(proxy)))

AtomicSwap Action · A.6.1.1.3.2.6.1.2.2.2.1.2.1.2.3:

> This action is split across two instructions which are applied as bookends to inner swap instructions.

**Action:** re-filed as `copy-paste`.

### 121. A.6.1.1.4.2.5.2.4.1.2.6 Integration Boost Data Submission Responsible Actor — real, re-filed

Sweep id `A.6.1.1.4.2.5.2.4.1.2.6#structural` (`45a70053-e0a3-4188-a40b-f6b64ffde9e6`), factual pass, category `structural`. The value is a garbled repeat that names no actor; sibling Integration Boost Instances (e.g. A.6.1.1.4.2.5.2.2.1.1.6) name Core Council Risk Advisor.

Integration Boost Data Submission Responsible Actor · A.6.1.1.4.2.5.2.4.1.2.6:

> The Data Submission Responsible Actor is The Data Submission Responsible Actor is.

Integration Boost Data Submission Responsible Actor · A.6.1.1.4.2.5.2.2.1.1.6:

> The Data Submission Responsible Actor is Core Council Risk Advisor.

**Action:** re-filed as `placeholder`.
