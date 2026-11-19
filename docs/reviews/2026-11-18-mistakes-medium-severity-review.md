# Medium-severity findings review

**Date:** 2026-11-18
**Corpus as reviewed:** `public/potential-mistakes.json` after the 2026-11-18 incremental sweep and that day's earlier reviews ([new contradictions](2026-11-18-mistakes-contradiction-review.md), [contradiction backlog](2026-11-18-mistakes-contradiction-backlog.md), [high severity](2026-11-18-mistakes-high-severity-review.md)); atlas SHA `6daa01968a0fc3fe67fdedc45761cf33ba114515`. Scope: every `medium` row those reviews did not already decide — 144 rows (45 language-pass, 82 factual-pass, 17 mechanical).
**Question:** does each defect hold as described, under the right category, at the right confidence?
**Method:** as in the high-severity review — each row read against the flagged document and whatever siblings, parents or linked documents the claim depends on, at the SHA above. Severity is the sweep's confidence that the defect is real, so a plainly real defect moves to `high` and an uncertain one to `low`. Every quote below was checked mechanically as a verbatim substring of the document it is attributed to.

---

## Bottom line

**77 real, 27 real but re-filed, 20 false positives, 10 duplicates, 1 fixed upstream, 9 already decided.** Of the kept rows, 24 moved up to `high` and 16 down to `low`. The medium bucket is noisier than the high one: about one row in seven is a false positive, and the factual pass often reported a real slip under the wrong category — most of the `naming` re-files are container documents carrying their hub Directory's title.

Review calls on top of the reviewers' verdicts:

- **Already decided (9 rows: 63, 66, 68, 70–72, 76, 78, 79).** These are the mechanical Keel In Progress Invocations rows (A.6.1.1.3) that the high-severity review kept as `structural` and lowered to `medium`, which put them back in this batch. Their reviewer here would file them as `xref` at `low`; they are left as decided, because they are detector-owned rows that a `--full` run re-derives under the detector's own category.
- **Duplicates (10).** The two passes, and the mechanical scan, often reported one defect twice. Each duplicate is rejected in favour of the row that names it best: the stale vote link in A.1.10.2.4.11.1.6, the stray "A.1.9 -" in A.1.10.2.4.9.2.3's title, the broken `ttps://` link in A.6.1.1.2.3.6.7, `Atlas Edit Proposal` in A.2.2.9.1.2.3.5.2 and A.2.2.9.2.2.3.5.2, "PYUSD" against "spPYUSD" in A.6.1.1.1.2.6.1.1.2.1.4.4, the three "Groves" rows (A.6.1.1.2.2.3.2, A.6.1.1.2.2.5.1.1, A.6.1.1.2.2.6.3), and the missing space in A.6.1.1.3.2.6.1.1.4.
- **Low-severity twins (4).** Four unreviewed `low` rows repeat a medium row reviewed here on the same document, in the same words: A.2.2.9.1.2.3.1.4.2 (row 24), A.6.1.1.1.3.4.2.2.2 (row 103), A.6.1.1.3.2.6.1.2.2.2.3.2.2 (row 124) and A.6.1.1.7.2.6.1.3.1.1.1.2.1.4 (row 141). The low copies are rejected as duplicates.
- **Row 119's quote** (A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.5.3) stitched the parent's description to the child's heading, so it could match no single document; it is re-anchored on the flagged document's own title.
- **Corpus row ids.** The high-severity review re-keyed nine detector rows without their detector suffix (`#structural` for `#structural-a6112212`); their original ids are restored.

| # | Finding | Category | Verdict | Action | Reason |
|---|---|---|---|---|---|
| 1 | A.1.2.2.2.22 The Definition Type | markdown | Real, re-filed | re-filed as `typo`, severity low | A.1.2.2.2.22 Type Overview ends without a terminal period, unlike sibling overviews (e.g. A.1.2.2.2.25); it is a punctuation slip, not a markdown issue. |
| 2 | A.1.2.2.2.26 The Focus Hub Type | grammar | Real | kept | A.1.2.2.2.26 writes "Focus Hubs Immutable or Primary Document"; the document belongs to the Focus Hub, so the possessive "Focus Hub's" is needed. |
| 3 | A.1.2.2.2.28 The Facilitator Scenario Type | duplication | Real | kept | A.1.2.2.2.28 states the Scenario Name numbering rule verbatim twice: inside the "Name" component and again as a Doc Identifier Rule. |
| 4 | A.1.2.2.2.28 The Facilitator Scenario Type | structural | Real | kept | A.1.2.2.2.28's example 'A.1.1-1.0.4.1.1.1' uses a hyphen, against A.1.2.1.1 (segments separated with dots) and the same structure shown as A.1.1.0.4.1.1.1 in A.1.2.2.2.29. |
| 5 | A.1.5.4.0.4.1 Highest Standard - Facilitators must apply strictest possible requirements of Universal Alignment on ACs | numeric | Real | kept | A.1.5.4.0.4.1 states one threshold as '51% more likely than not' (incoherent compounding) and then as '51% or greater chance' in the next sentence. |
| 6 | A.1.5.5.0.4.1 Operationally Active - Whether An Entity Is “Operationally Active" In A Role Is Determined Purely On A Formal Basis | markdown | Real | kept | The A.1.5.5.0.4.1 title pairs a curly opening quote with a straight closing quote; the body uses straight quotes on both sides, so the fix matches. |
| 7 | A.1.6.3.0.3.1 Delegated Voting Power - Element Annotation | structural | False positive | rejected | Element Annotations are scoped to their own Target Documents; A.1.6.3.0.3.1 explains the delegation mechanism for A.1.6.3 while A.1.6.4.1.3.3.0.3.1 gives the quantity sense for the ranking rule. Not a contradiction. |
| 8 | A.1.6.4.3.1 Voting-Activity Metrics | grammar | Real | kept, severity low | In A.1.6.4.3.1 the subject "their RD rank, and the budget eligibility..." is compound and takes the plural "are". The commas make the singular arguable, so confidence is low. |
| 9 | A.1.6.4.3.3.1 Signal Account Requirement | governance | Real | kept | Parent A.1.6.4.3.3 makes failing emergency comms cost RD income (rank transfer only for Level 3), but child A.1.6.4.3.3.1 has the Core Facilitator remove RD status outright. |
| 10 | A.1.9.1.3.2 Emergency Contact Mechanism | governance | False positive | rejected | A.1.9.1.3.2 covers selection/validation of the mechanism; A.1.9.1.3.2.3 is a specific process for changing the approved one and still requires PSWL consultation. A general rule beside a named change process. |
| 11 | A.1.9.1.3.2.4 Emergency Contact Mechanism Fire Drills | naming | Real | kept, severity low | A.1.9.1.3.2.4 writes "firedrills" twice in its body, while its own title and A.1.9.1.6 use the two words "fire drills". |
| 12 | A.1.10.2.3.2.2.1.4.1.1.1 Delay In Submitting Or Failure To Thoroughly And Accurately Complete Report | governance | False positive | rejected | The Atlas has the Core Facilitator and Core Spell Teams act on behalf of the Core Council (A.0.1.2.1, A.1.10.2.3.2.2.1.4.1.2), so 'as determined by the Core Council' fits A.1.10.2.3.2.2.1.3.3 rather than naming a rival authority. |
| 13 | A.1.10.2.4.8.5.3 Core Facilitator Validates Executive Document | markdown | Real | kept | In A.1.10.2.4.8.5.3 the link text starts with a stray "(" and a stray ")" follows the link, so the rendered text shows unbalanced parentheses. |
| 14 | A.1.10.2.4.9.2.3 A.1.9 -Spell Reviewer Direct Authoring Ban | structural | Duplicate | rejected (duplicate of `A.1.10.2.4.9.2.3#copy-paste`) | The title of A.1.10.2.4.9.2.3 begins with a stray 'A.1.9 -' before the real title. |
| 15 | A.1.10.2.4.11.1.6 Governance Point Validates Executive Document | xref | Duplicate | rejected (duplicate of `A.1.10.2.4.11.1.6#markdown`) | A.1.10.2.4.11.1.6 hides a stale vote.makerdao.com link behind '(' next to the vote.sky.money link; parallel step A.1.10.2.4.8.5.3 links only vote.sky.money. |
| 16 | A.1.10.2.4.12.3.1.1 Spell Validators Must Ensure Tests Pass | markdown | Real | kept | In step 1 of A.1.10.2.4.12.3.1.1 the opening `<` sits inside the code span and the closing `>` outside it. Copied as written, the command is broken. |
| 17 | A.1.10.2.4.12.3.3.7 Spell Validators Should Review Constants | copy-paste | Real | kept | A.1.10.2.4.12.3.3.7 contains the sentence "Group this with general constant validations...", an editorial note about how to organize the document, not guidance for validators. |
| 18 | A.1.10.4.1 Spark Agent | stale | Real | kept, fix corrected | A.1.10.4.1 calls Spark one of the initial Agents but still says the Allocation System is 'upcoming' and that SparkLend will be adopted 'once Agents are launched'. |
| 19 | A.1.10.5.2.3.3.1 AD Reliance On Core GovOps In Standby Spell Process Where Core GovOps Is Nonresponsive | naming | Real | kept, severity low | A.1.10.5.2.3.3.1 says "the Emergency Spell" for what is elsewhere "the Standby Spell". Standby Spells are a subset of Emergency Spells (A.1.10.5.2), so the term is valid but inconsistent with the parallel A.1.10.5.3.2.3.1. |
| 20 | A.2.1.1.1.0.3.3 Document Is Appealed - Element Annotation | copy-paste | Real | kept | Unlike siblings A.2.1.1.1.0.3.1 and .0.3.2, A.2.1.1.1.0.3.3 never names its element ("document is appealed", from A.2.1.1.1), so "The element means" has no referent. |
| 21 | A.2.2.1.2.4.2.1.1 Prohibition On Deactivating Genesis Primitives | structural | Real | kept | A.2.2.1.2.4.2.1.1 gives the Primitives a Global Status of `Completed`, which A.2.2.1.3.2.3 defines only as an instance Status, separate from Global Activation Status (A.2.2.1.3.1). |
| 22 | A.2.2.6.2.1.2.2 Root Edit Primitive Review By Operational Facilitator | entity | Real | kept, severity high | A.2.2.6.2.1.2.2 says the Operational Facilitator reviews, then gives the first aspect to the Operational Executor; A.2.2.6.2.2.2 assigns the alignment review to the Operational Facilitator. |
| 23 | A.2.2.9.1.2.2.3 Required Primitive Inputs | wrong-word | Real | kept | A.2.2.9.1.2.2.3 says 'Create' for a Primitive Hub Document whose only change is an 'Updated Field'; elsewhere hub updates use 'Edit' (A.2.2.9.2.2.3.5.4.2). The same slip is in A.2.2.9.2.2.2.3. |
| 24 | A.2.2.9.1.2.3.1.4.2 Agent Artifact Updates | naming | Real | kept | A.2.2.9.1.2.3.1.4.2 gives the same path twice, the second time without 'Directory'; the full form matches A.2.2.9.1.2.3.2.4.2.1's title. |
| 25 | A.2.2.9.1.2.3.5.2 Process Flow | entity | Real | kept, severity high | A.2.2.9.1.2.3.5.2 names an `Atlas Edit Proposal`; every sibling step (e.g. A.2.2.9.1.2.3.5.3, A.2.2.9.1.2.3.4.2) works on the `Artifact Edit Proposal`. |
| 26 | A.2.2.9.1.2.3.5.2 Process Flow | naming | Duplicate | rejected (duplicate of `A.2.2.9.1.2.3.5.2#entity`) | A.2.2.9.1.2.3.5.2 says `Atlas Edit Proposal`, but every other step of this process, including sibling A.2.2.9.1.2.3.5.3, names the document `Artifact Edit Proposal`. |
| 27 | A.2.2.9.2.2.3.5.2 Process Flow | entity | Real | kept, severity high | A.2.2.9.2.2.3.5.2 names an `Atlas Edit Proposal`; sibling steps (A.2.2.9.2.2.3.5.3, A.2.2.9.2.2.3.4.2) use the `Artifact Edit Proposal`. |
| 28 | A.2.2.9.2.2.3.5.2 Process Flow | naming | Duplicate | rejected (duplicate of `A.2.2.9.2.2.3.5.2#entity`) | A.2.2.9.2.2.3.5.2 repeats the `Atlas Edit Proposal` naming slip, while its sibling A.2.2.9.2.2.3.5.3 edits the `Artifact Edit Proposal` Document. |
| 29 | A.2.2.9.2.2.3.6.4.1.2 Current Integrators Active Data Update | structural | Real, re-filed | re-filed as `copy-paste` | A.2.2.9.2.2.3.6.4.1.2 (Integration Boost) copies Distribution Reward's A.2.2.9.1.2.3.6.4.1.2 verbatim, including Reward Code and Tracking Methodology, which Integration Boost's inputs (A.2.2.9.2.2.3.1.3) never define. |
| 30 | A.2.2.10.1.1.3.2.1.2.3.1 Mandate and Rationale | grammar | Real | kept | A.2.2.10.1.1.3.2.1.2.3.1 announces a "dual purpose" and marks the second with "second" but never marks the first with "First", so the enumeration is unbalanced. |
| 31 | A.2.2.10.1.1.3.2.1.2.3.1 Mandate and Rationale | grammar | Real | kept | In A.2.2.10.1.1.3.2.1.2.3.1 "which latter includes" is malformed, and the singular "includes" disagrees with the plural "cycles"; "which include" fixes both. |
| 32 | A.2.3.1.2.1.1 Net Revenue | typo | Real | kept, severity high | A.2.3.1.2.1.1 ends its final sentence without a period while every earlier sentence in the document has one. |
| 33 | A.2.4.1.2.2.1.1.2.3.2.1.1 Low Yield Actively Stabilizing Collateral | xref | Real | kept, fix corrected | A.2.4.1.2.2.1.1.2.3.2.1.1 defines a subset of Actively Stabilizing Collateral but links A.3.3.2.2.1.1 (Resting), which is only one part of it; the general definition is A.3.3.2.2.1. |
| 34 | A.2.7.1.1.1.1.4.0.6.1 Current Authorized Forum Accounts | structural | Real | kept | Keel's row in A.2.7.1.1.1.1.4.0.6.1 lists N/A for both entity handle and representatives, so it registers no account; A.2.7.1.1.1.1.1 allows N/A handle only when relying on Authorized Representatives. |
| 35 | A.2.7.1.2.1.1.1.1 Sky Forum-Specific Requirements | grammar | Real | kept, severity high | A.2.7.1.2.1.1.1.1 refers to banning "a user" and then to "the users'" exercise in the same clause; the possessive should be singular. |
| 36 | A.2.7.1.2.1.1.3 Unbanning | wrong-word | False positive | rejected | In A.2.7.1.2.1.1.3 "unbanned users" means users unbanned by the binding Governance Poll; the sentence extends that lifting to all channels. This is redundant wording, not a contradiction. |
| 37 | A.2.8.2.2.2.1.2.1 Grove Prime Treasury | numeric | Real | kept, severity low | 'increase this allocation by 5%' reads as 5% of 3B (150M), but 500M is 5% of the 10B total supply in A.2.8.2.2.2.1.1; the base is ambiguous wording, the figure itself is consistent with total supply. |
| 38 | A.2.8.2.7.1.2 Duration Of The Accord | stale | Real, re-filed | re-filed as `numeric`, severity low | Accord 7 (Sky-Skybase) commences Sept 1, 2024, before Accords 1-2 (May 29, 2025) and 17 months before Skybase's Jan 29, 2026 Genesis allocation (A.2.8.2.7.2.2.2.1); a likely wrong date, not stale content. |
| 39 | A.2.9.1.1.1.4.2.2.6 Resilience Fund Claim Approval Quorum And Decision Majorities | governance | False positive | rejected | The Committee is 'a group of Ecosystem Actors' (A.2.9.1.1.1.2) whose 'individual members' serve on its behalf (A.2.9.1.1.1.2.2); listed member Gallagher is an entity that can supply three experts, so the quorum is satisfiable. |
| 40 | A.2.11.1.1.1 Introduction | stale | Real | kept | A.2.11.1.1.1 ties the SparkLend bounty to 'until the launch of the Spark Agent', yet Spark's TGE occurred (A.2.8.2.2.2.7.1.1.1) and Spark SubProxy grants were paid through 2026; the sunset condition has lapsed. |
| 41 | A.2.11.1.2.2.3.2.3 Diligence Requirements Parameter | grammar | Real | kept | The prose value of diligenceRequirements in A.2.11.1.2.2.3.2.3 needs the plural possessive "Sky and Stars' discretion"; the string is policy text, not a code identifier. |
| 42 | A.2.11.1.3.2.1.1.4 Standard Threshold Recommendations | numeric | Real | kept | Capital Allocation is classed High ($1M-$10M exposure per A.2.11.1.3.2.1.1.1.1) yet recommended 3/5, while A.2.11.1.3.2.1.1.2.3.2 requires >=7 signers for multisigs managing >=$1M; the other High rows are 4/7. |
| 43 | A.2.11.1.3.4.1 Multisig Registry Entry Requirements | structural | Real | kept | Impact and Operational classifications must be provided 'as part of the Multisig registration process' (A.2.11.1.3.2.1.1.1.1/.1.2) and reviewed quarterly (A.2.11.1.3.3.1), but the Registry entry schema A.2.11.1.3.4.1 has no classification field. |
| 44 | A.3.2.2.1.1.1.1.1.3.1 Lower Bound | structural | Real, re-filed | re-filed as `naming` | Symbol a is the Leverage Adjusted Drift To Risk Ratio (A.3.2.2.1.1.1.1.1.1.1) used as exponent -2a in PD, and is rebound to 0.13 in step 3 (A.3.2.2.1.1.1.1.1.3.1); a notation collision (K is likewise reused). |
| 45 | A.3.2.2.1.1.1.1.1.3.3 Sensitivity Coefficient | naming | Real | kept, severity high | The heading of A.3.2.2.1.1.1.1.1.3.3 is "Sensitivity Coefficient" but its body calls K the "Sensitivity Factor", and no other document uses either name. |
| 46 | A.3.2.2.1.1.1.5.2.2.1.2 Exposure At Default Equal To Book Value Multiplied By Credit Conversion Factor | xref | Real | kept | A.3.2.2.1.1.1.5.2.1 maps Off-Balance Sheet Items to CRE20.94-101 and Derivatives/SFTs to CRE50-52, so citing CRE51 for the off-balance-sheet CCF in A.3.2.2.1.1.1.5.2.2.1.2 contradicts the chunk's own mapping. |
| 47 | A.3.2.2.1.1.1.5.2.6 Determine Required Risk Capital | numeric | False positive | rejected | The RWA path (A.3.2.2.1.1.1.5.2.6) and the lending-market model are distinct methodologies; in the latter CR divides K and is offset by ECR (A.3.2.2.1.1.1.1.1.5), so 8.75% plays a different role than the RWA 8% ratio. |
| 48 | A.3.2.2.1.2.2.1 Smart Contract Risk Rating Cap | structural | False positive | rejected | A.3.2.2.1.2.2.1 and A.3.2.2.1.3.1.1 expressly call CAP a temporary cap; higher-band methodologies being dormant while a named temporary override is in force is by design, not a defect. |
| 49 | A.3.2.2.1.2.2.3 Code Complexity Rating | naming | Real | kept, severity high | The heading of A.3.2.2.1.2.2.3 and its children .3.1-.3.3 all say "Code Complexity Rating", but its body says "Code Complexity Rate". |
| 50 | A.3.2.2.1.2.3.1.2.5.1 Constant Factor | structural | Real, re-filed | re-filed as `naming` | b is the piecewise function's medium risk parameter = 0.25 (A.3.2.2.1.2.3.3.1.2) and is rebound to 0.15 as the blend constant (A.3.2.2.1.2.3.1.2.5.1) in the same calculation chain; a notation collision. |
| 51 | A.3.2.2.1.2.3.4 Reference Implementation | numeric | Real | kept, severity low | In f1_thresholds_low_risk (A.3.2.2.1.2.3.4) x_max = x_start + 0.50 and kink is 75% of the gap, so a 5% start gives 42.5% and 55%, not the docstring's 23.75% and 30%. |
| 52 | A.3.2.2.1.3.1.2 Starting Rating | naming | Real | kept, severity high, fix corrected | Only the heading of A.3.2.2.1.3.1.2 says "Starting Rating". Its body, its children .2.1-.2.3 and A.3.2.2.1.2.2.2 all say "Starting Rate", so the heading is what should change, not the body. |
| 53 | A.3.3.1.3 Application To Prime Agents | xref | Real | kept | A.3.3.1.3 points both ASC and DAB percentages at A.3.3.2.2, which sets only the 5% ASC minimum; the DAB level is in A.3.3.2.3. |
| 54 | A.3.4.3.3.1 Monthly Arranger Report Requirements | structural | Real, re-filed | re-filed as `copy-paste` | The income bullet in A.3.4.3.3.1 ends with the expense bullet's wording ('non-ordinary expenses'), a copy-paste slip; the fix 'income' is right. |
| 55 | A.3.7.1.1.2.5.1.1 Auction Price Function (cut) | grammar | Real | kept | A.3.7.1.1.2.5.1.1 is otherwise in the present tense, so the past-tense "equated" is wrong; it should read "equates to". |
| 56 | A.3.7.1.1.4 Oracles | structural | Real, re-filed | re-filed as `contradiction` | A.3.7.1.1.4 calls WBTC a Native Vault Engine collateral type, but A.3.7.1.1.3.2 says WBTC-A/B/C are otherwise not NVE collateral; STETH also matches no vault type (A.3.7.1.1.1 has WSTETH-A/B). |
| 57 | A.3.7.1.4.1 Chainlink Automation | stale | Real | kept | A 3-year stream starting 29 May 2023 ended 29 May 2026, yet parent A.3.7.1.4 presents these as the current keeper payment streams. |
| 58 | A.4.3 Savings Rate And Token Reward Mechanism | naming | Real | kept | A.4.3 writes "Dai users" and then "DAI users" and "DAI Savings Rate"; its child A.4.3.1 and A.3.1.2.4 write "Dai Savings Rate". |
| 59 | A.4.4.1.3.8.5.1 Initial Parameter Values Set In Executive Vote | numeric | False positive | rejected | The initial values were set by the deploying Executive Vote, which the BEAM bounds do not limit (A.4.4.1.3.8.5), and BEAM params are modifiable (A.4.4.1.3.8.3); a historical 0 bps start does not breach the current min. |
| 60 | A.5.3.1.1.1 Token Distribution | entity | Real | kept, severity low | A.5.3.1.1.1 describes the multisig as a wallet operated by the Accessibility Facilitators, yet says burning happens by calling `burn` 'on the multisig'; the call is made from the multisig to the SKY token. |
| 61 | A.5.4.1.1 Reduce Exposure To Locations | structural | Real | kept | A.5.4.1.1 says subdocuments identify locations for both categories, but only A.5.4.1.4.1 lists locations; the limited-filtering Flagged IPs doc A.5.4.1.3.2 lists none and defers to frontends. |
| 62 | A.5.4.1.4.1 Flagged IPs | copy-paste | Real, re-filed | re-filed as `naming`, severity low | In A.5.4.1.4.1 only the Luhansk entry adds "of Ukraine", while the parallel Donetsk entry does not. That is an inconsistent name, not copy-paste residue. |
| 63 | A.6.1.1.*.2.2.1.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.2.1.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.2.1.2) rather than the sibling Active Instances Directory (.2.2.1.1.2) as Spark's A.6.1.1.1.2.2.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 64 | A.6.1.1.*.2.2.2.2.1.2.1.1 (corpus-wide) | structural | False positive | rejected | Spark (A.6.1.1.1.2.2.2.2.1.2.1.1) and Grove use total supply consistently within their own doc; per-agent Root Edit thresholds may differ and nothing in the text says they must match. |
| 65 | A.6.1.1.*.2.2.2.2.1.2.3 (corpus-wide) | structural | False positive | rejected | Each agent's Emergency Protocol matches its own child: Obex's A.6.1.1.5.2.2.2.2.1.2.3.1 covers only Emergency Situations, Spark's A.6.1.1.1.2.2.2.2.1.2.3.1 covers Urgent and Emergency; a per-agent difference, not a defect. |
| 66 | A.6.1.1.*.2.2.3.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.2.3.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.2.3.2) rather than the sibling Active Instances Directory (.2.2.3.1.2) as Spark's A.6.1.1.1.2.2.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 67 | A.6.1.1.*.2.3.2 (corpus-wide) | structural | Duplicate | rejected (duplicate of `A.6.1.1.2.2.3.2#grammar`) | A.6.1.1.2.2.3.2 uses "Groves" where the possessive "Grove's" is meant (other agents write e.g. "Spark’s Instances"); a missing apostrophe, i.e. a typo. |
| 68 | A.6.1.1.*.2.4.1.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.4.1.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.4.1.2) rather than the sibling Active Instances Directory (.2.4.1.1.2) as Spark's A.6.1.1.1.2.4.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 69 | A.6.1.1.*.2.5.1.1 (corpus-wide) | structural | Duplicate | rejected (duplicate of `A.6.1.1.2.2.5.1.1#grammar`) | A.6.1.1.2.2.5.1.1 uses "Groves" where the possessive "Grove's" is meant (other agents write e.g. "Spark’s Instances"); a missing apostrophe, i.e. a typo. |
| 70 | A.6.1.1.*.2.5.1.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.5.1.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.5.1.2) rather than the sibling Active Instances Directory (.2.5.1.1.2) as Spark's A.6.1.1.1.2.5.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 71 | A.6.1.1.*.2.5.2.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.5.2.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.5.2.2) rather than the sibling Active Instances Directory (.2.5.2.1.2) as Spark's A.6.1.1.1.2.5.2.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 72 | A.6.1.1.*.2.5.3.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.5.3.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.5.3.2) rather than the sibling Active Instances Directory (.2.5.3.1.2) as Spark's A.6.1.1.1.2.5.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 73 | A.6.1.1.*.2.6.1.1.4 (corpus-wide) | structural | Duplicate | rejected (duplicate of `A.6.1.1.3.2.6.1.1.4#markdown`) | A.6.1.1.3.2.6.1.1.4 is missing the space between "to" and the link; the link target itself matches the other agents, so this is a typo, not structural. |
| 74 | A.6.1.1.*.2.6.1.2.2.3 (corpus-wide) | structural | False positive | rejected | "in the event of" vs "in case of" is harmless wording variation; Osero's A.6.1.1.7.2.6.1.2.2.3 has since been rewritten to point to A.2.2.10.1.1.1.2.5.4 anyway. |
| 75 | A.6.1.1.*.2.6.1.3.1.1.1.2.4 (corpus-wide) | structural | False positive | rejected | Keel's A.6.1.1.3.2.6.1.3.1.1.1.2.4 says deposit and withdrawal because its children are a Deposit Rate Limit and a Withdrawal Rate Limit; accurate per-instance wording, not a defect. |
| 76 | A.6.1.1.*.2.6.2.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.6.2.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.6.2.2) rather than the sibling Active Instances Directory (.2.6.2.1.2) as Spark's A.6.1.1.1.2.6.2.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 77 | A.6.1.1.*.2.6.3 (corpus-wide) | structural | Duplicate | rejected (duplicate of `A.6.1.1.2.2.6.3#typo`) | A.6.1.1.2.2.6.3 uses "Groves" where the possessive "Grove's" is meant (other agents write e.g. "Spark’s Instances"); a missing apostrophe, i.e. a typo. |
| 78 | A.6.1.1.*.2.6.3.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.6.3.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.6.3.2) rather than the sibling Active Instances Directory (.2.6.3.1.2) as Spark's A.6.1.1.1.2.6.3.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 79 | A.6.1.1.*.2.7.1.1.4 (corpus-wide) | structural | Already decided | unchanged (decided in the high-severity review) | Keel's A.6.1.1.3.2.7.1.1.4 sends completed Invocations to the Active Instances store (A.6.1.1.3.2.7.1.2) rather than the sibling Active Instances Directory (.2.7.1.1.2) as Spark's A.6.1.1.1.2.7.1.1.4 and Keel's own A.6.1.1.3.2.6.1.1.4 do; link-target inconsistency. |
| 80 | A.6.1.1.1.2.1.1.3 Completed Instances Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.1.2.1.1.3 is titled 'Completed Instances Directory', duplicating hub doc A.6.1.1.1.2.1.1.1.3, while the same slot is 'Completed Instances' in A.6.1.1.1.2.1.2.3/.3.3/.4.3. |
| 81 | A.6.1.1.1.2.1.1.4 In Progress Invocations Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.1.2.1.1.4 is titled 'In Progress Invocations Directory', the same as hub doc A.6.1.1.1.2.1.1.1.4; sibling primitives use 'In Progress Invocations' (A.6.1.1.1.2.1.2.4). |
| 82 | A.6.1.1.1.2.6.1.1.2.1.4.4 Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document Location | naming | Real | kept, fix corrected | A.6.1.1.1.2.6.1.1.2.1.4.4 names the instance "Spark Savings v2 PYUSD" but links a document titled "spPYUSD". The sibling ICDs (ETH, USDC, USDT) use the plain token name. |
| 83 | A.6.1.1.1.2.6.1.1.2.1.4.4 Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document Location | xref | Duplicate | rejected (duplicate of `A.6.1.1.1.2.6.1.1.2.1.4.4#naming`) | The link label matches its target A.6.1.1.1.2.6.1.3.1.4.4's title, so the xref resolves; the defect is inconsistent naming (PYUSD vs spPYUSD) between this Location doc and the ICD. |
| 84 | A.6.1.1.1.2.6.1.1.2.4.1 Spark Savings V2 | markdown | Real, re-filed | re-filed as `typo`, severity high | A.6.1.1.1.2.6.1.1.2.4.1 (renumbered) has no closing period, unlike the same boilerplate in its siblings, e.g. A.6.1.1.1.2.6.1.1.2.3.1. A missing period is punctuation, not markdown. |
| 85 | A.6.1.1.1.2.6.1.1.2.5.1 Spark Savings V2 | markdown | Real, re-filed | re-filed as `typo`, severity high | A.6.1.1.1.2.6.1.1.2.5.1 (renumbered) has no closing period, unlike the same boilerplate in its sibling A.6.1.1.1.2.6.1.1.2.5.2. A missing period is punctuation, not markdown. |
| 86 | A.6.1.1.1.2.6.1.2.1.1.1.2.6.1 ALM Controller (ForeignController Avalanche) Contract Address | grammar | Real | kept | "address" is doubled in A.6.1.1.1.2.6.1.2.1.1.1.2.6.1 (and in its .7.1 and .8.1 siblings); A.6.1.1.1.2.6.1.2.1.1.1.1.1 uses the clean "The address of the X contract is:". |
| 87 | A.6.1.1.1.2.6.1.2.1.1.3.7.2 USDG Robinhood Chain ALM Proxy Maximum | entity | Real | kept, severity low | A.6.1.1.1.2.6.1.2.1.1.3.7.2 says the limit governs USDG sent to the Robinhood Chain ALM Proxy, but its Recipient differs from the ALM_PROXY address in A.6.1.1.1.2.6.1.2.1.1.1.2.7.5 and appears nowhere else. |
| 88 | A.6.1.1.1.2.6.1.2.1.2.2.2.3 Signers | governance | Real | kept, fix corrected | 2/5 lets Soter Labs' or SAF's 2 signers act alone despite 'jointly controlled' (A.6.1.1.1.2.6.1.2.1.2.2.2), and it breaks the >=2/3 rule in A.6.1.1.1.2.6.1.2.1.2.2.2.5; 3/5 would still fall short. |
| 89 | A.6.1.1.1.2.6.1.2.2.3.2.2 ERC-4626 Withdrawal Action | duplication | Real | kept | A.6.1.1.1.2.6.1.2.2.3.2.2 shares its title with A.6.1.1.1.2.6.1.2.2.3.2.1 and its body is only a link, and that link points to a Mainnet Controller procedure inside the L2 section. |
| 90 | A.6.1.1.1.2.6.1.2.2.3.2.4 Aave AToken Withdrawal Action | duplication | Real | kept | A.6.1.1.1.2.6.1.2.2.3.2.4 repeats the title, prose and code of its sibling A.6.1.1.1.2.6.1.2.2.3.2.3; only the linked procedure differs. |
| 91 | A.6.1.1.1.2.6.1.2.2.3.2.4 Aave AToken Withdrawal Action | xref | Real | kept | A foreignController L2 action in A.6.1.1.1.2.6.1.2.2.3.2.4 links the Mainnet Controller procedure, while sibling A.6.1.1.1.2.6.1.2.2.3.2.3 links the Foreign Controller procedure for the same code. |
| 92 | A.6.1.1.1.2.6.1.2.2.3.4.2 ERC-4626 Withdrawal Action | duplication | Real | kept | A.6.1.1.1.2.6.1.2.2.3.4.2 shares its sibling A.6.1.1.1.2.6.1.2.2.3.4.1's title, and its only content is a link that 3.4.1 already contains. |
| 93 | A.6.1.1.1.2.6.1.3.1.4.4.4.1.3 Setter | entity | Real | kept, severity low | The spPYUSD Setter (now A.6.1.1.1.2.6.1.3.1.4.4.4.1.3) is the ALM Proxy Freezable, unlike the Spark Operations Multisig used by the ETH/USDC/USDT siblings; this may be deliberate. |
| 94 | A.6.1.1.1.2.6.1.3.1.6.5.2.1.4 Token | typo | False positive | rejected | Every sibling Uniswap v4 Token parameter (A.6.1.1.1.2.6.1.3.1.6.1-.6.4 .2.1.4) concatenates the pair, as in PYUSDUSDS and USDTUSDS, so OUSDUSDS follows house style. The slash form appears only in rate-limit text. |
| 95 | A.6.1.1.1.2.6.1.3.1.6.5.2.4 Rate Limits | markdown | Real | kept, severity high | A.6.1.1.1.2.6.1.3.1.6.5.2.4 puts the comma inside the code span (`maxAmount,`); the parallel A.6.1.1.1.2.6.1.4.1.6.3.2.4 writes `maxAmount`, outside the backticks. |
| 96 | A.6.1.1.1.2.6.1.3.2.1.1.3 Instance-specific Operational Processes | xref | Real | kept, fix corrected | Base instance A.6.1.1.1.2.6.1.3.2.1.1.3 links Mainnet Controller docs, but Base instances such as A.6.1.1.1.2.6.1.4.2.1.1.3 link the Foreign Controller ERC-4626 Functions and A...2.2.3.2.1; both links need changing. |
| 97 | A.6.1.1.1.2.6.1.3.5.2.1.4.1.2 Sentinel Role Addresses | entity | Real | kept, fix corrected | The two entity attributions conflict, but the Sentinel row is right: every other curator table (e.g. A.6.1.1.1.2.6.1.3.1.3.1.4.1.1) gives 0x50c7 as Spark, so the swap is in the sibling A.6.1.1.1.2.6.1.3.5.2.1.4.1.1. |
| 98 | A.6.1.1.1.2.6.1.4.1.6.3.2.4.1 Inflow Rate Limit | grammar | Real | kept, severity high | A.6.1.1.1.2.6.1.4.1.6.3.2.4.1 says 'parameter is' before a two-item list; every sibling (e.g. A.6.1.1.1.2.6.1.4.1.6.2.2.4.1) says 'parameters are'. |
| 99 | A.6.1.1.1.2.6.1.4.1.6.3.2.4.2 Outflow Rate Limit | grammar | Real | kept, severity high | A.6.1.1.1.2.6.1.4.1.6.3.2.4.2 says 'parameter is' before a two-item list; siblings such as A.6.1.1.1.2.6.1.4.1.6.2.2.4.2 say 'parameters are'. |
| 100 | A.6.1.1.1.2.6.1.4.1 Ethereum Mainnet Instances | structural | Fixed upstream | rejected | The container is now A.6.1.1.1.2.6.1.4.1, and the Blackrock and Centrifuge groups sit inside it as A.6.1.1.1.2.6.1.4.1.8 and .9. |
| 101 | A.6.1.1.1.3.1.3.3.4.1 Disclosure Of Conflicts | structural | Real, re-filed | re-filed as `grammar` | A.6.1.1.1.3.1.3.3.4.1 says 'disclosed to both the Spark Foundation' but names only one recipient, so either a second party is missing or 'both' is stray. |
| 102 | A.6.1.1.1.3.2.1.1.3.2.2 SparkLend Cap Automator wstETH Parameters | numeric | False positive | rejected | A borrow-cap max of 1 with a larger gap is a deliberate pattern: rETH (A.6.1.1.1.3.2.1.1.3.2.3) has the same shape and also lists Borrowing: Yes (A.6.1.1.1.3.2.1.1.2.1.11); max simply bounds the automator. |
| 103 | A.6.1.1.1.3.4.2.2.2 Evaluation Method | xref | Real, re-filed | re-filed as `naming`, fix corrected | The link target is right (A.6.1.1.1.3.4.2.1 holds the ratio), but 'Risk Tolerance Ratio' is a stale name: the Parameters doc A.6.1.1.1.3.4.2.1.3 names it the 'Target Encumbrance Ratio'. |
| 104 | A.6.1.1.1.3.10.3 Permitted Actions | naming | Real | kept, severity high | A.6.1.1.1.3.10.3 uses 'Confidential Strategic Integration and Deployment' earlier in the same document, then 'Strategic Partnership and Deployment' once; the A.6.1.1.1.3.10 framework never uses 'Partnership'. |
| 105 | A.6.1.1.2.2.1.1.3 Completed Instances Directory | structural | Real, re-filed | re-filed as `naming` | The container is titled 'Completed Instances Directory', the same title as the hub directory A.6.1.1.2.2.1.1.1.3, while sibling primitives name the slot 'Completed Instances' (A.6.1.1.2.2.1.2.3). The defect is a title, not structure. |
| 106 | A.6.1.1.2.2.6.1.2.1.1.3.1.2.3 Maximum USDC Bridged From Avalanche To Ethereum Mainnet Via Circle CCTP | numeric | False positive | rejected | 'slope: Unlimited' alongside 'maxAmount: Unlimited' is a common convention across the rate-limit tables, e.g. A.6.1.1.3.2.6.1.2.1.1.3.1.1.2 and A.6.1.1.1.2.6.1.2.1.1.3.6.1. |
| 107 | A.6.1.1.2.2.6.1.3.1.1.3.2.5.1 Maximum Exposure | numeric | False positive | rejected | Grove states Maximum Exposure caps in USDS whatever the supplied asset: the USDG (A.6.1.1.2.2.6.1.3.7.1.1.2.5.1) and USDC/AUSD (A.6.1.1.2.2.6.1.3.1.12.3.2.5.1) Instances do the same, so USDS is the unit of account here. |
| 108 | A.6.1.1.2.2.6.1.3.2.1.1.2.2.1 Token Address | entity | False positive | rejected | The address is still present, so this is not fixed, but the Ethereum Centrifuge JTRSY ICD (A.6.1.1.2.2.6.1.3.1.1.1.2.2.1) also gives 0xFE69…d77A as its 'Token Address'. The Avalanche doc follows that convention, and the text cannot show the address is wrong. |
| 109 | A.6.1.1.2.2.6.1.3.4.1.1.2.1.3 Asset Supplied By Grove Liquidity Layer | entity | Real | kept | The Plasma 'Aave v3 USDT0' Instance says the asset supplied is USDC, yet its Token is USDT0 (A.6.1.1.2.2.6.1.3.4.1.1.2.1.4) and its inflow limit is denominated in USDT0 (A.6.1.1.2.2.6.1.3.4.1.1.2.4.1). |
| 110 | A.6.1.1.2.2.6.1.3.7.2.1.2.2.1 Token Address | entity | False positive | rejected | In Paxos conversion ICDs, Token Address = Underlying = the supplied asset, not the received one: e.g. the Grove USDC-to-USDG Instance A.6.1.1.2.2.6.1.3.1.15.1.2.2.1 lists the USDC address. |
| 111 | A.6.1.1.2.3.6.7 Authorization To Subscribe And Purchase Notes Issued By Galaxy CLO | xref | Duplicate | rejected (duplicate of `A.6.1.1.2.3.6.7#markdown`) | The link target in A.6.1.1.2.3.6.7 starts 'ttps://' (missing h), so it does not match its link text and will not resolve. |
| 112 | A.6.1.1.3.2.1.1.3 Completed Instances Directory | structural | Real, re-filed | re-filed as `naming` | The container is titled 'Completed Instances Directory' (the same title as the hub directory A.6.1.1.3.2.1.1.1.3), while sibling A.6.1.1.3.2.1.2.3 is 'Completed Instances'. The defect is a title. |
| 113 | A.6.1.1.3.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate | markdown | Real, re-filed | re-filed as `typo` | A.6.1.1.3.2.3.2.2.1.2.1.3 (renumbered) ends without a period; this is missing punctuation, not a markdown problem. |
| 114 | A.6.1.1.3.2.6.1.2.1.1.3.1.1.1 USDS Mint Maximum | numeric | False positive | rejected | 10,000 USDS is low but self-consistent (maxAmount and slope agree) and plausibly a deliberate near-zero mint cap. LIMIT_USDS_TO_USDC is not 'unreachable', because USDS can enter other ways. The text alone shows no error. |
| 115 | A.6.1.1.3.2.6.1.2.1.1.3.1.2.1 Ethereum Mainnet sUSDS Deposit Maximum | numeric | Real, re-filed | re-filed as `wrong-word`, severity low, fix corrected | LIMIT_4626_DEPOSIT counts deposited assets (USDS), so the USDS figures are right. The loose phrase 'amount of sUSDS that can be deposited' is the error. Spark's version says 'USDS worth of sUSDS' (A.6.1.1.1.2.6.1.2.1.1.3.3.5). |
| 116 | A.6.1.1.3.2.6.1.2.1.1.3.2.1.2 USDS For USDC Swap Maximum | numeric | Real | kept, severity low | Only Solana limit at 100M/50M, identical to the Mainnet swap A.6.1.1.3.2.6.1.2.1.1.3.1.1.3, and above the 25M aggregate USDS Reserve cap A.6.1.1.3.2.6.1.2.1.1.3.2.1.1; likely copy-paste, though the Reserve still binds. |
| 117 | A.6.1.1.3.2.6.1.2.1.2.3.1.5 Modification | grammar | Real | kept, severity high, fix corrected | A.6.1.1.3.2.6.1.2.1.2.3.1.5 pairs the plural subject 'Changes' with the singular 'is a controller action'. |
| 118 | A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.4 ERC-7540 Functions | entity | Real | kept | The Atlas describes ERC-7540 elsewhere as an asynchronous request/claim vault flow (A.2.2.10.1.1.1.2.3.1.2.8), and this doc's children request and claim deposits. 'Multiple underlying assets' misdescribes the standard; the Obex and Pattern copies have the same text. |
| 119 | A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.5.3 Transfer Token Via LayerZero | structural | Real | kept | Not fixed: Transfer Token Via LayerZero still sits under PSM Functions (A.6.1.1.3.2.6.1.2.2.1.1.2.1.2.5, defined as swap operations), and the LayerZero entry in Bridging Functions .6.2 still says 'future iteration'. |
| 120 | A.6.1.1.3.2.6.1.2.2.2.1.1 Role Hierarchy And Permissions | structural | Real | kept | A.6.1.1.3.2.6.1.2.2.2.1.1 lists four roles but its children define only Default Admin (.1), Relayer (.2) and Freezer (.3); there is no ALM Controller role document. |
| 121 | A.6.1.1.3.2.6.1.2.2.2.1.1.2 Relayer Role | naming | Real | kept, severity low | A.6.1.1.3.2.6.1.2.2.2.1.1.2 writes 'Relayer role' and then 'Relayer Role' in the same paragraph; sibling A.6.1.1.3.2.6.1.2.2.2.1.1.3 keeps 'Freezer role' lowercase. This is cosmetic. |
| 122 | A.6.1.1.3.2.6.1.2.2.2.1.1.3 Freezer Role | typo | Real | kept, severity high | A.6.1.1.3.2.6.1.2.2.2.1.1.3 has a stray space before the comma after `can_freeze_controller`. |
| 123 | A.6.1.1.3.2.6.1.2.2.2.3.2.1 Full Freeze | grammar | Real | kept, severity high | A.6.1.1.3.2.6.1.2.2.2.3.2.1 combines 'nor' with 'cannot', a double negative with no 'neither'; the fix 'and' gives the intended meaning. |
| 124 | A.6.1.1.3.2.6.1.2.2.2.3.2.2 Reallocation Freeze | copy-paste | Real | kept | Reallocation Freeze (status Frozen) reuses Full Freeze's 'complete freeze' wording and says much the same about funds and configuration, so nothing separates it from PushPullFrozen (A.6.1.1.3.2.6.1.2.2.2.3.2.1). |
| 125 | A.6.1.1.4.2.1.1.3 Completed Instances Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.4.2.1.1.3 holds the Instances but is titled like the hub Directory A.6.1.1.4.2.1.1.1.3; sibling A.6.1.1.4.2.1.2.3 is 'Completed Instances'. Title-only defect (template-wide across Agent Creation Primitives). |
| 126 | A.6.1.1.4.2.1.1.4 In Progress Invocations Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.4.2.1.1.4 duplicates the hub title 'In Progress Invocations Directory' (A.6.1.1.4.2.1.1.1.4); the parallel slot A.6.1.1.4.2.1.2.4 is 'In Progress Invocations'. Title-only defect. |
| 127 | A.6.1.1.4.2.5.2.1.2.3 Morpho Instance Configuration Document Location | markdown | Real | kept | The link text in A.6.1.1.4.2.5.2.1.2.3 has no ' - ' separator; sibling documents A.6.1.1.4.2.5.2.1.2.1 and .2 use it. The links are in sibling documents, not the same one. |
| 128 | A.6.1.1.4.2.5.2.2.1.2.1 Routine Protocol | xref | Real | kept, severity high | Euler is an Integration Boost Instance (A.6.1.1.4.2.5.2) but cites the Distribution Reward Near-Term Process A.2.2.9.1.2.1.3.3.1; Curve/Morpho siblings cite A.2.2.9.2.2.1.3.2.1. |
| 129 | A.6.1.1.4.2.5.2.2.3.1.2 Integration Partner Reward Address | entity | Real → false positive (see addendum) | rejected | Morpho (A.6.1.1.4.2.5.2.2.3.1.2) and Curve (A.6.1.1.4.2.5.2.2.2.1.2) list the identical partner reward address while every other Integration Partner Reward Address is unique; likely copy-paste, unverifiable from text. |
| 130 | A.6.1.1.4.2.5.2.4.1.3.1 Routine Protocol | xref | Real | kept, severity high | Compound Integration Boost Invocation cites Distribution Reward Near-Term Process A.2.2.9.1.2.1.3.3.1 instead of Integration Boost's A.2.2.9.2.2.1.3.2.1, as Curve/Morpho do. |
| 131 | A.6.1.1.5.2.1.1.3 Completed Instances Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.5.2.1.1.3 holds Instances but is titled 'Completed Instances Directory', same as hub doc A.6.1.1.5.2.1.1.1.3; sibling A.6.1.1.5.2.1.2.3 is 'Completed Instances'. Title-only defect. |
| 132 | A.6.1.1.5.2.6.1.2.1.1.1.2.1 Ethereum Mainnet | structural | Real | kept, severity high | Ethereum Mainnet container A.6.1.1.5.2.6.1.2.1.1.1.2.1 has no children; the ALM contract docs are its siblings .2.2-.2.7, unlike the Allocator side where .1.1 contains .1.1.1-.1.1.5. |
| 133 | A.6.1.1.5.2.6.1.2.1.2.1 Invoking New Instances | grammar | Real, re-filed | re-filed as `xref`, severity high, fix corrected | Every sibling Prime (e.g. A.6.1.1.6.2.6.1.2.1.2.1) has the same 'process see' wording but links the Operational Process Definition; in A.6.1.1.5.2.6.1.2.1.2.1 the link is lost and only plain text remains. |
| 134 | A.6.1.1.6.2.1.1.3 Completed Instances Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.6.2.1.1.3 holds Instances but carries the hub Directory title of A.6.1.1.6.2.1.1.1.3; sibling A.6.1.1.6.2.1.2.3 is 'Completed Instances'. Title-only defect. |
| 135 | A.6.1.1.6.2.1.1.4 In Progress Invocations Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.6.2.1.1.4 duplicates hub title 'In Progress Invocations Directory' (A.6.1.1.6.2.1.1.1.4); parallel slot A.6.1.1.6.2.1.2.4 is 'In Progress Invocations'. Title-only defect. |
| 136 | A.6.1.1.6.2.6.1.1.2.1.2 River | grammar | Real | kept, severity high | A.6.1.1.6.2.6.1.1.2.1.2 has a stray 'deals' that breaks the sentence; sibling A.6.1.1.6.2.6.1.1.2.1.1 reads '... of the Maple Protocol with `Active` Status are stored herein.' |
| 137 | A.6.1.1.6.2.6.1.2.2.1.2.1.2.6.3 Transfer Token Via LayerZero | structural | Real | kept | LayerZero transfer sits under PSM Functions A.6.1.1.6.2.6.1.2.2.1.2.1.2.6, scoped to PSM swaps; Grove files the same operation under its own 'LayerZero Bridging Functions' group A.6.1.1.2.2.6.1.2.2.1.2.1.2.13. |
| 138 | A.6.1.1.6.2.6.1.3.1.2 River | grammar | Real | kept, severity high | A.6.1.1.6.2.6.1.3.1.2 has a stray 'deals' that breaks the sentence; sibling A.6.1.1.6.2.6.1.3.1.1 reads '... of the Maple Protocol with `Active` Status are stored herein.' |
| 139 | A.6.1.1.7.2.1.1.4 In Progress Invocations Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.7.2.1.1.4 is titled like hub doc A.6.1.1.7.2.1.1.1.4; parallel A.6.1.1.7.2.1.2.4 is 'In Progress Invocations' (Osero's .1.3 already uses 'Completed Instances'). Title-only defect. |
| 140 | A.6.1.1.7.2.5.1.2.2.2.1 Routine Protocol | copy-paste | False positive | rejected | 'customized to <Agent>' names the Agent, not the Instance, across every Prime. A.6.1.1.1.2.5.1.2.1.2.1 says 'customized to Spark' and all Osero instances say 'Osero', so 'Osero' is correct here. |
| 141 | A.6.1.1.7.2.6.1.3.1.1.1.2.1.4 Token | naming | Real → false positive (see addendum) | rejected | Mainnet Token identifier A.6.1.1.7.2.6.1.3.1.1.1.2.1.4 is all-lowercase 'ogusdcp' while the parallel Base Instance A.6.1.1.7.2.6.1.3.2.1.1.2.1.4 writes 'ogUSDCb'; on-chain symbol casing not verifiable from text. |
| 142 | A.6.1.1.8.2.1.1.1.3 Completed Instances | structural | Real, re-filed | re-filed as `naming`, severity high | Hub doc A.6.1.1.8.2.1.1.1.3 describes itself as a Directory yet is titled 'Completed Instances'; every other agent's hub slot (e.g. A.6.1.1.7.2.1.1.1.3) is 'Completed Instances Directory'. |
| 143 | A.6.1.1.8.2.1.1.3 Completed Instances Directory | structural | Real, re-filed | re-filed as `naming` | A.6.1.1.8.2.1.1.3 holds the Instances (child is the Single Instance Configuration Document) but is titled 'Completed Instances Directory'; parallel A.6.1.1.8.2.1.2.3 is 'Completed Instances'. |
| 144 | NR-7 Defining “Severe Actions Or Violations" And “Governance Attack” | markdown | Real | kept | The NR-7 title opens "Severe Actions Or Violations" with a curly quote and closes it with a straight quote; "Governance Attack" is correctly paired. |

---

## Rejected, re-filed or changed — evidence

### 1. A.1.2.2.2.22 The Definition Type — real, re-filed

Sweep id `A.1.2.2.2.22#markdown` (`6eceace8-f499-4954-9ecc-1ada12a02c18`), language pass, category `markdown`. A.1.2.2.2.22 Type Overview ends without a terminal period, unlike sibling overviews (e.g. A.1.2.2.2.25); it is a punctuation slip, not a markdown issue.

The Definition Type · A.1.2.2.2.22:

> contained in subdocuments to the Target Document of the Definition Document

The Navigation Hub Type · A.1.2.2.2.25:

> It acts as an entry point and guide for navigating the content of an Immutable or Primary Document.

**Action:** re-filed as `typo`, severity low.

### 7. A.1.6.3.0.3.1 Delegated Voting Power - Element Annotation — false positive

Sweep id `A.1.6.3.0.3.1#structural` (`9446b896-f33f-4593-97e9-60db6c385afd`), factual pass, category `structural`. Element Annotations are scoped to their own Target Documents; A.1.6.3.0.3.1 explains the delegation mechanism for A.1.6.3 while A.1.6.4.1.3.3.0.3.1 gives the quantity sense for the ranking rule. Not a contradiction.

In General · A.1.6.3:

> Delegate Contracts are smart contracts that can receive delegated voting power from SKY holders and Staking users.

Delegated Voting Power - Element Annotation · A.1.6.4.1.3.3.0.3.1:

> refers to the cumulative SKY that has been delegated to an Aligned Delegate

**Action:** rejected.

### 8. A.1.6.4.3.1 Voting-Activity Metrics — real

Sweep id `A.1.6.4.3.1#grammar` (`ad1ef0f4-246f-4289-b5fc-ea5c91508ccf`), language pass, category `grammar`. In A.1.6.4.3.1 the subject "their RD rank, and the budget eligibility..." is compound and takes the plural "are". The commas make the singular arguable, so confidence is low.

Voting-Activity Metrics · A.1.6.4.3.1:

> their RD rank, and the budget eligibility associated with that rank, is transferred to the next highest-ranking AD

**Action:** kept, severity low.

### 10. A.1.9.1.3.2 Emergency Contact Mechanism — false positive

Sweep id `A.1.9.1.3.2#governance` (`3efb0238-aaae-4351-9ec9-31902f3a1394`), factual pass, category `governance`. A.1.9.1.3.2 covers selection/validation of the mechanism; A.1.9.1.3.2.3 is a specific process for changing the approved one and still requires PSWL consultation. A general rule beside a named change process.

Emergency Contact Mechanism · A.1.9.1.3.2:

> This emergency contact mechanism is selected and validated by the Protocol Security Workstream Lead.

Changes To Approved Emergency Contact Mechanisms · A.1.9.1.3.2.3:

> but they must do so in consultation with the Protocol Security Workstream Lead

**Action:** rejected.

### 11. A.1.9.1.3.2.4 Emergency Contact Mechanism Fire Drills — real

Sweep id `A.1.9.1.3.2.4#naming` (`4627de70-9866-41b8-be8e-68e9ca809a45`), language pass, category `naming`. A.1.9.1.3.2.4 writes "firedrills" twice in its body, while its own title and A.1.9.1.6 use the two words "fire drills".

Emergency Contact Mechanism Fire Drills · A.1.9.1.3.2.4:

> may run firedrills to test the preparedness of individuals

Emergency Contact Mechanism Fire Drills · A.1.9.1.3.2.4:

> Emergency Contact Mechanism Fire Drills

Accountability For Emergency Response Preparedness · A.1.9.1.6:

> running fire drills

**Action:** kept, severity low.

### 12. A.1.10.2.3.2.2.1.4.1.1.1 Delay In Submitting Or Failure To Thoroughly And Accurately Complete Report — false positive

Sweep id `A.1.10.2.3.2.2.1.4.1.1.1#governance` (`01b44f43-c6e1-4b24-b715-296a5122fb35`), factual pass, category `governance`. The Atlas has the Core Facilitator and Core Spell Teams act on behalf of the Core Council (A.0.1.2.1, A.1.10.2.3.2.2.1.4.1.2), so 'as determined by the Core Council' fits A.1.10.2.3.2.2.1.3.3 rather than naming a rival authority.

Core Council’s Broad Discretionary Capacity · A.0.1.2.1:

> the Core Facilitator, on behalf of the Core Council, is empowered to infer the Spirit of the Atlas

Core Spell Teams Review Prime Spell Security Incident Report · A.1.10.2.3.2.2.1.4.1.2:

> The relevant Core Spell Team, on behalf of the Core Council, must review this Incident Report

Delay In Submitting Or Failure To Thoroughly And Accurately Complete Report · A.1.10.2.3.2.2.1.4.1.1.1:

> as determined by the Core Council, constitutes a separate Prime Spell Security Incident

**Action:** rejected.

### 14. A.1.10.2.4.9.2.3 A.1.9 -Spell Reviewer Direct Authoring Ban — duplicate

Sweep id `A.1.10.2.4.9.2.3#structural` (`952d9bdc-1298-49b5-a52f-11ab480a82b7`), factual pass, category `structural`. The title of A.1.10.2.4.9.2.3 begins with a stray 'A.1.9 -' before the real title.

A.1.9 -Spell Reviewer Direct Authoring Ban · A.1.10.2.4.9.2.3:

> A.1.9 -Spell Reviewer Direct Authoring Ban

**Action:** rejected (duplicate of `A.1.10.2.4.9.2.3#copy-paste`).

### 15. A.1.10.2.4.11.1.6 Governance Point Validates Executive Document — duplicate

Sweep id `A.1.10.2.4.11.1.6#xref` (`12ebd0d9-52dc-4d1f-8e1a-8bdc2a51b9b0`), factual pass, category `xref`. A.1.10.2.4.11.1.6 hides a stale vote.makerdao.com link behind '(' next to the vote.sky.money link; parallel step A.1.10.2.4.8.5.3 links only vote.sky.money.

Governance Point Validates Executive Document · A.1.10.2.4.11.1.6:

> Executive Validator [(](https://vote.makerdao.com/executive/create)[https://vote.sky.money/executive/create](https://vote.sky.money/executive/create))

Core Facilitator Validates Executive Document · A.1.10.2.4.8.5.3:

> Executive Validator [(https://vote.sky.money/executive/create](https://vote.sky.money/executive/create))

**Action:** rejected (duplicate of `A.1.10.2.4.11.1.6#markdown`).

### 18. A.1.10.4.1 Spark Agent — real

Sweep id `A.1.10.4.1#stale` (`fe525e67-1142-4312-bab7-bd9549747f77`), factual pass, category `stale`. A.1.10.4.1 calls Spark one of the initial Agents but still says the Allocation System is 'upcoming' and that SparkLend will be adopted 'once Agents are launched'.

Spark Agent · A.1.10.4.1:

> Spark is one of the initial Agents focused on developing crypto on-chain lending engines.

Spark Agent · A.1.10.4.1:

> structured as a Conduit in the upcoming Allocation System. SparkLend will be adopted by Spark once Agents are launched.

Corrected fix: `Drop 'in the upcoming Allocation System' and the sentence 'SparkLend will be adopted by Spark once Agents are launched.', since the document already calls Spark an Agent.`

**Action:** kept, fix corrected.

### 19. A.1.10.5.2.3.3.1 AD Reliance On Core GovOps In Standby Spell Process Where Core GovOps Is Nonresponsive — real

Sweep id `A.1.10.5.2.3.3.1#naming` (`0567fc4c-4a93-4f7e-803e-f587ddbd4f15`), language pass, category `naming`. A.1.10.5.2.3.3.1 says "the Emergency Spell" for what is elsewhere "the Standby Spell". Standby Spells are a subset of Emergency Spells (A.1.10.5.2), so the term is valid but inconsistent with the parallel A.1.10.5.3.2.3.1.

AD Reliance On Core GovOps In Standby Spell Process Where Core GovOps Is Nonresponsive · A.1.10.5.2.3.3.1:

> validate the authenticity of the Emergency Spell pursuant to

Standby Spells · A.1.10.5.2:

> A subset of Emergency Spells is Standby Spells.

AD Reliance On Core GovOps In Emergency Drop Spell Process Where Core GovOps Is Nonresponsive · A.1.10.5.3.2.3.1:

> validate the authenticity of the Emergency Drop Spell pursuant to

**Action:** kept, severity low.

### 22. A.2.2.6.2.1.2.2 Root Edit Primitive Review By Operational Facilitator — real

Sweep id `A.2.2.6.2.1.2.2#entity` (`823cad54-4438-4ec3-9e13-d2624795fabd`), factual pass, category `entity`. A.2.2.6.2.1.2.2 says the Operational Facilitator reviews, then gives the first aspect to the Operational Executor; A.2.2.6.2.2.2 assigns the alignment review to the Operational Facilitator.

Root Edit Primitive Review By Operational Facilitator · A.2.2.6.2.1.2.2:

> First, the Operational Executor reviews the proposal for alignment with the Atlas.

Artifact Edit Process · A.2.2.6.2.2.2:

> the Operational Facilitator must review each proposal for alignment and conformance

**Action:** kept, severity high.

### 25. A.2.2.9.1.2.3.5.2 Process Flow — real

Sweep id `A.2.2.9.1.2.3.5.2#entity` (`d0ceb4ed-8f65-45c6-808e-fca702dc2a62`), factual pass, category `entity`. A.2.2.9.1.2.3.5.2 names an `Atlas Edit Proposal`; every sibling step (e.g. A.2.2.9.1.2.3.5.3, A.2.2.9.1.2.3.4.2) works on the `Artifact Edit Proposal`.

Process Flow · A.2.2.9.1.2.3.5.2:

> Using the finalized `Atlas Edit Proposal` content

Required Primitive Inputs · A.2.2.9.1.2.3.5.3:

> Edit `Artifact Edit Proposal` Document

**Action:** kept, severity high.

### 26. A.2.2.9.1.2.3.5.2 Process Flow — duplicate

Sweep id `A.2.2.9.1.2.3.5.2#naming` (`d0ceb4ed-8f65-45c6-808e-fca702dc2a62`), language pass, category `naming`. A.2.2.9.1.2.3.5.2 says `Atlas Edit Proposal`, but every other step of this process, including sibling A.2.2.9.1.2.3.5.3, names the document `Artifact Edit Proposal`.

Process Flow · A.2.2.9.1.2.3.5.2:

> Using the finalized `Atlas Edit Proposal` content

Required Primitive Inputs · A.2.2.9.1.2.3.5.3:

> Edit `Artifact Edit Proposal` Document

**Action:** rejected (duplicate of `A.2.2.9.1.2.3.5.2#entity`).

### 27. A.2.2.9.2.2.3.5.2 Process Flow — real

Sweep id `A.2.2.9.2.2.3.5.2#entity` (`185d7f3b-9612-42ef-bde7-c9a64ad3ceab`), factual pass, category `entity`. A.2.2.9.2.2.3.5.2 names an `Atlas Edit Proposal`; sibling steps (A.2.2.9.2.2.3.5.3, A.2.2.9.2.2.3.4.2) use the `Artifact Edit Proposal`.

Process Flow · A.2.2.9.2.2.3.5.2:

> Using the finalized `Atlas Edit Proposal` content

Required Primitive Inputs · A.2.2.9.2.2.3.5.3:

> Edit `Artifact Edit Proposal` Document

**Action:** kept, severity high.

### 28. A.2.2.9.2.2.3.5.2 Process Flow — duplicate

Sweep id `A.2.2.9.2.2.3.5.2#naming` (`185d7f3b-9612-42ef-bde7-c9a64ad3ceab`), language pass, category `naming`. A.2.2.9.2.2.3.5.2 repeats the `Atlas Edit Proposal` naming slip, while its sibling A.2.2.9.2.2.3.5.3 edits the `Artifact Edit Proposal` Document.

Process Flow · A.2.2.9.2.2.3.5.2:

> Using the finalized `Atlas Edit Proposal` content

Required Primitive Inputs · A.2.2.9.2.2.3.5.3:

> Edit `Artifact Edit Proposal` Document

**Action:** rejected (duplicate of `A.2.2.9.2.2.3.5.2#entity`).

### 29. A.2.2.9.2.2.3.6.4.1.2 Current Integrators Active Data Update — real, re-filed

Sweep id `A.2.2.9.2.2.3.6.4.1.2#structural` (`1b03bc85-a7f4-4cc5-be41-d13a16b8c379`), factual pass, category `structural`. A.2.2.9.2.2.3.6.4.1.2 (Integration Boost) copies Distribution Reward's A.2.2.9.1.2.3.6.4.1.2 verbatim, including Reward Code and Tracking Methodology, which Integration Boost's inputs (A.2.2.9.2.2.3.1.3) never define.

Current Integrators Active Data Update · A.2.2.9.2.2.3.6.4.1.2:

> New value: set to the Reward Code from the approved Proposal

Required Primitive Inputs · A.2.2.9.1.2.3.1.3:

> `Reward Code`: the Reward Code

Required Primitive Inputs · A.2.2.9.2.2.3.1.3:

> `Custom Instance Parameters`: details for any custom parameters

**Action:** re-filed as `copy-paste`.

### 32. A.2.3.1.2.1.1 Net Revenue — real

Sweep id `A.2.3.1.2.1.1#typo` (`bddce7bf-c568-444b-b196-e15a99016696`), language pass, category `typo`. A.2.3.1.2.1.1 ends its final sentence without a period while every earlier sentence in the document has one.

Net Revenue · A.2.3.1.2.1.1:

> Income and Expenses are defined such that Net Revenue must always be positive

**Action:** kept, severity high.

### 33. A.2.4.1.2.2.1.1.2.3.2.1.1 Low Yield Actively Stabilizing Collateral — real

Sweep id `A.2.4.1.2.2.1.1.2.3.2.1.1#xref` (`858b2ee0-89b8-4505-8324-f3cd315de40c`), factual pass, category `xref`. A.2.4.1.2.2.1.1.2.3.2.1.1 defines a subset of Actively Stabilizing Collateral but links A.3.3.2.2.1.1 (Resting), which is only one part of it; the general definition is A.3.3.2.2.1.

Low Yield Actively Stabilizing Collateral · A.2.4.1.2.2.1.1.2.3.2.1.1:

> Actively Stabilizing Collateral (see [A.3.3.2.2.1.1 - Resting Actively Stabilizing Collateral](0e17b35a-c830-4695-b63c-5ef58b249d3f))

Actively Stabilizing Collateral · A.3.3.2.2.1:

> Actively Stabilizing Collateral is the sum of (1) Resting Actively Stabilizing Collateral and (2) Latent Actively Stabilizing Collateral.

Corrected fix: `Low Yield Actively Stabilizing Collateral is Actively Stabilizing Collateral (see [A.3.3.2.2.1 - Actively Stabilizing Collateral](62495dee-8d2a-45d4-87c4-01150e3db3c8)) that earns less than the Agent Credit Line Borrow Rate.`

**Action:** kept, fix corrected.

### 35. A.2.7.1.2.1.1.1.1 Sky Forum-Specific Requirements — real

Sweep id `A.2.7.1.2.1.1.1.1#grammar` (`a3e4d767-56d1-4b1f-8ade-b733bca4244f`), language pass, category `grammar`. A.2.7.1.2.1.1.1.1 refers to banning "a user" and then to "the users'" exercise in the same clause; the possessive should be singular.

Sky Forum-Specific Requirements · A.2.7.1.2.1.1.1.1:

> the reasons for banning a user if the ban interrupts the users' exercise of a governance process

**Action:** kept, severity high.

### 36. A.2.7.1.2.1.1.3 Unbanning — false positive

Sweep id `A.2.7.1.2.1.1.3#wrong-word` (`4d4a1d9a-c8c7-4c2b-aaec-33e382790d52`), language pass, category `wrong-word`. In A.2.7.1.2.1.1.3 "unbanned users" means users unbanned by the binding Governance Poll; the sentence extends that lifting to all channels. This is redundant wording, not a contradiction.

Unbanning · A.2.7.1.2.1.1.3:

> The outcome of the Governance Poll is binding.

Unbanning · A.2.7.1.2.1.1.3:

> Where identity can be proven, the ban on unbanned users will be lifted across all communication channels.

**Action:** rejected.

### 37. A.2.8.2.2.2.1.2.1 Grove Prime Treasury — real

Sweep id `A.2.8.2.2.2.1.2.1#numeric` (`9d7a2d3f-3079-4d3b-be89-e06966aec07c`), factual pass, category `numeric`. 'increase this allocation by 5%' reads as 5% of 3B (150M), but 500M is 5% of the 10B total supply in A.2.8.2.2.2.1.1; the base is ambiguous wording, the figure itself is consistent with total supply.

Grove Prime Treasury · A.2.8.2.2.2.1.2.1:

> with an option to further increase this allocation by 5% (500,000,000 tokens)

Total Token Supply · A.2.8.2.2.2.1.1:

> The total token supply of each of the SPK and GROVE tokens shall be 10,000,000,000 (ten billion).

**Action:** kept, severity low.

### 38. A.2.8.2.7.1.2 Duration Of The Accord — real, re-filed

Sweep id `A.2.8.2.7.1.2#stale` (`9d207eb3-955e-4b4d-af1b-056519d0235b`), factual pass, category `stale`. Accord 7 (Sky-Skybase) commences Sept 1, 2024, before Accords 1-2 (May 29, 2025) and 17 months before Skybase's Jan 29, 2026 Genesis allocation (A.2.8.2.7.2.2.2.1); a likely wrong date, not stale content.

Duration Of The Accord · A.2.8.2.7.1.2:

> The duration of Ecosystem Accord 7 is indefinite, commencing from September 1, 2024.

Duration Of The Accord · A.2.8.2.1.1.2:

> The duration of Ecosystem Accord 1 is six (6) months, commencing from May 29, 2025.

Transfer Of Genesis Capital Allocation To Skybase SubProxy · A.2.8.2.7.2.2.2.1:

> was included in the January 29, 2026 Executive Vote

**Action:** re-filed as `numeric`, severity low.

### 39. A.2.9.1.1.1.4.2.2.6 Resilience Fund Claim Approval Quorum And Decision Majorities — false positive

Sweep id `A.2.9.1.1.1.4.2.2.6#governance` (`10662753-b167-4043-b952-225cc9dd9e49`), factual pass, category `governance`. The Committee is 'a group of Ecosystem Actors' (A.2.9.1.1.1.2) whose 'individual members' serve on its behalf (A.2.9.1.1.1.2.2); listed member Gallagher is an entity that can supply three experts, so the quorum is satisfiable.

Resilience Fund Technical Committee · A.2.9.1.1.1.2:

> The Resilience Technical Committee is a group of Ecosystem Actors authorized by Sky

Resilience Fund Technical Committee Member Requirements · A.2.9.1.1.1.2.2:

> The individual members of the Resilience Technical Committee who are directly involved in providing operational services on behalf of Sky

**Action:** rejected.

### 44. A.3.2.2.1.1.1.1.1.3.1 Lower Bound — real, re-filed

Sweep id `A.3.2.2.1.1.1.1.1.3.1#structural` (`68c5da4f-9c4e-4206-a582-99be9833481f`), factual pass, category `structural`. Symbol a is the Leverage Adjusted Drift To Risk Ratio (A.3.2.2.1.1.1.1.1.1.1) used as exponent -2a in PD, and is rebound to 0.13 in step 3 (A.3.2.2.1.1.1.1.1.3.1); a notation collision (K is likewise reused).

Lower Bound · A.3.2.2.1.1.1.1.1.3.1:

> The Lower Bound $a$ is an estimate of the correlation between assets during "calm" periods. It is set of `0.13`.

Leverage Adjusted Drift To Risk Ratio · A.3.2.2.1.1.1.1.1.1.1:

> The Leverage Adjusted Drift To Risk Ratio $a$ is calculated as follows

**Action:** re-filed as `naming`.

### 45. A.3.2.2.1.1.1.1.1.3.3 Sensitivity Coefficient — real

Sweep id `A.3.2.2.1.1.1.1.1.3.3#naming` (`3b7924b2-1236-43cb-b0f0-ebe06f573b78`), language pass, category `naming`. The heading of A.3.2.2.1.1.1.1.1.3.3 is "Sensitivity Coefficient" but its body calls K the "Sensitivity Factor", and no other document uses either name.

Sensitivity Coefficient · A.3.2.2.1.1.1.1.1.3.3:

> Sensitivity Coefficient

Sensitivity Coefficient · A.3.2.2.1.1.1.1.1.3.3:

> The Sensitivity Factor `K` is a tuning parameter

**Action:** kept, severity high.

### 47. A.3.2.2.1.1.1.5.2.6 Determine Required Risk Capital — false positive

Sweep id `A.3.2.2.1.1.1.5.2.6#numeric` (`70013695-3823-407a-9603-b38795ba9899`), factual pass, category `numeric`. The RWA path (A.3.2.2.1.1.1.5.2.6) and the lending-market model are distinct methodologies; in the latter CR divides K and is offset by ECR (A.3.2.2.1.1.1.1.1.5), so 8.75% plays a different role than the RWA 8% ratio.

Determine Required Risk Capital · A.3.2.2.1.1.1.5.2.6:

> by an 8% capital ratio to arrive at Instance Financial RRC

Real World Assets · A.3.2.2.1.1.1.5:

> The documents herein define the calculation of Instance Financial RRC for Real World Assets.

Effective Capital Ratio · A.3.2.2.1.1.1.1.1.5.3:

> 8.75%

**Action:** rejected.

### 48. A.3.2.2.1.2.2.1 Smart Contract Risk Rating Cap — false positive

Sweep id `A.3.2.2.1.2.2.1#structural` (`b824c6ec-940b-4921-89f0-aca89b54e86a`), factual pass, category `structural`. A.3.2.2.1.2.2.1 and A.3.2.2.1.3.1.1 expressly call CAP a temporary cap; higher-band methodologies being dormant while a named temporary override is in force is by design, not a defect.

Smart Contract Risk Rating Cap · A.3.2.2.1.2.2.1:

> is a temporary cap on the Smart Contract Risk Rating

Administrative Risk Rating Cap · A.3.2.2.1.3.1.1:

> is a temporary cap on the Administrative Risk Rating

**Action:** rejected.

### 49. A.3.2.2.1.2.2.3 Code Complexity Rating — real

Sweep id `A.3.2.2.1.2.2.3#naming` (`295e4d3b-8c8a-4f74-879f-88060bb07803`), language pass, category `naming`. The heading of A.3.2.2.1.2.2.3 and its children .3.1-.3.3 all say "Code Complexity Rating", but its body says "Code Complexity Rate".

Code Complexity Rating · A.3.2.2.1.2.2.3:

> The Code Complexity Rate $CCR$ is a measure

Code Complexity Rating Maximum · A.3.2.2.1.2.2.3.1:

> The Code Complexity Rating Maximum $\text{CCRMax}$ is the maximum Code Complexity Rating for a protocol.

**Action:** kept, severity high.

### 50. A.3.2.2.1.2.3.1.2.5.1 Constant Factor — real, re-filed

Sweep id `A.3.2.2.1.2.3.1.2.5.1#structural` (`303c0d7f-42a7-4b9e-8afd-26e4d54e2f56`), factual pass, category `structural`. b is the piecewise function's medium risk parameter = 0.25 (A.3.2.2.1.2.3.3.1.2) and is rebound to 0.15 as the blend constant (A.3.2.2.1.2.3.1.2.5.1) in the same calculation chain; a notation collision.

Constant Factor · A.3.2.2.1.2.3.1.2.5.1:

> The constant factor $b$ is set to `0.15`.

Medium Risk Parameter · A.3.2.2.1.2.3.3.1.2:

> The $b$ parameter is set to `0.25`.

**Action:** re-filed as `naming`.

### 51. A.3.2.2.1.2.3.4 Reference Implementation — real

Sweep id `A.3.2.2.1.2.3.4#numeric` (`35ec7382-0613-4e74-b5ba-d86c647b1d73`), factual pass, category `numeric`. In f1_thresholds_low_risk (A.3.2.2.1.2.3.4) x_max = x_start + 0.50 and kink is 75% of the gap, so a 5% start gives 42.5% and 55%, not the docstring's 23.75% and 30%.

Reference Implementation · A.3.2.2.1.2.3.4:

> in % terms, e.g. 5%, 23.75%, 30%, etc.

Reference Implementation · A.3.2.2.1.2.3.4:

> x_max = x_start + 0.50  # always a 50% gap to max

**Action:** kept, severity low.

### 52. A.3.2.2.1.3.1.2 Starting Rating — real

Sweep id `A.3.2.2.1.3.1.2#naming` (`368786cb-da80-4d48-a2e8-52d14fb6320c`), language pass, category `naming`. Only the heading of A.3.2.2.1.3.1.2 says "Starting Rating". Its body, its children .2.1-.2.3 and A.3.2.2.1.2.2.2 all say "Starting Rate", so the heading is what should change, not the body.

Starting Rating · A.3.2.2.1.3.1.2:

> Starting Rating

No Backdoor · A.3.2.2.1.3.1.2.1:

> The Starting Rate for a protocol with no backdoor access is `0`.

Starting Rate · A.3.2.2.1.2.2.2:

> The Starting Rate $SR$ is an arbitrary starting risk rating for protocols.

Corrected fix: `Rename the heading of A.3.2.2.1.3.1.2 from "Starting Rating" to "Starting Rate" so it matches its body, its three children and the sibling parameter A.3.2.2.1.2.2.2 - Starting Rate.`

**Action:** kept, severity high, fix corrected.

### 54. A.3.4.3.3.1 Monthly Arranger Report Requirements — real, re-filed

Sweep id `A.3.4.3.3.1#structural` (`7b902bb1-68b4-477d-a575-29aaa02e9e7b`), factual pass, category `structural`. The income bullet in A.3.4.3.3.1 ends with the expense bullet's wording ('non-ordinary expenses'), a copy-paste slip; the fix 'income' is right.

Monthly Arranger Report Requirements · A.3.4.3.3.1:

> Any income over $20,000 in value should be broken out as its own line item, and an explanation provided for any non-recurring or non-ordinary expenses.

Monthly Arranger Report Requirements · A.3.4.3.3.1:

> Any expense over $20,000 in value should be broken out as its own line item, and an explanation provided for any non-recurring or non-ordinary expenses.

**Action:** re-filed as `copy-paste`.

### 56. A.3.7.1.1.4 Oracles — real, re-filed

Sweep id `A.3.7.1.1.4#structural` (`a38e05bf-0820-4916-a71c-cff4f54e45df`), factual pass, category `structural`. A.3.7.1.1.4 calls WBTC a Native Vault Engine collateral type, but A.3.7.1.1.3.2 says WBTC-A/B/C are otherwise not NVE collateral; STETH also matches no vault type (A.3.7.1.1.1 has WSTETH-A/B).

Oracles · A.3.7.1.1.4:

> The Native Vault Engine collateral types of ETH, STETH, WBTC will specifically use the Chronicle v3 oracle solution

Offboarding WBTC Collateral · A.3.7.1.1.3.2:

> These are otherwise not considered Native Vault Engine collateral

**Action:** re-filed as `contradiction`.

### 59. A.4.4.1.3.8.5.1 Initial Parameter Values Set In Executive Vote — false positive

Sweep id `A.4.4.1.3.8.5.1#numeric` (`13c51e11-8ea3-4d4e-b631-2e99c559a914`), factual pass, category `numeric`. The initial values were set by the deploying Executive Vote, which the BEAM bounds do not limit (A.4.4.1.3.8.5), and BEAM params are modifiable (A.4.4.1.3.8.3); a historical 0 bps start does not breach the current min.

Update Process · A.4.4.1.3.8.5:

> These processes do not limit the ability of Sky Governance to set the stUSDS parameters via an Executive Vote.

Parameter Adjustments · A.4.4.1.3.8.3:

> All stUSDS BEAM parameters can be modified by Core GovOps, in consultation with the Core Council Risk Advisor.

Initial Parameter Values Set In Executive Vote · A.4.4.1.3.8.5.1:

> - `str` - 0 basis points

**Action:** rejected.

### 60. A.5.3.1.1.1 Token Distribution — real

Sweep id `A.5.3.1.1.1#entity` (`eaf8cf29-90fd-4b9b-b0a8-02ce8386908c`), factual pass, category `entity`. A.5.3.1.1.1 describes the multisig as a wallet operated by the Accessibility Facilitators, yet says burning happens by calling `burn` 'on the multisig'; the call is made from the multisig to the SKY token.

Token Distribution · A.5.3.1.1.1:

> will be burned by calling the `burn` function on the multisig

Token Distribution · A.5.3.1.1.1:

> was transferred to the multisig wallet operated by the Accessibility Facilitators

**Action:** kept, severity low.

### 62. A.5.4.1.4.1 Flagged IPs — real, re-filed

Sweep id `A.5.4.1.4.1#copy-paste` (`e6b9065e-8dd7-4f23-b7e4-4e3d2736bee4`), language pass, category `copy-paste`. In A.5.4.1.4.1 only the Luhansk entry adds "of Ukraine", while the parallel Donetsk entry does not. That is an inconsistent name, not copy-paste residue.

Flagged IPs · A.5.4.1.4.1:

> - Donetsk People’s Republic
> - Luhansk People’s Republic of Ukraine

**Action:** re-filed as `naming`, severity low.

### 64. A.6.1.1.*.2.2.2.2.1.2.1.1 (corpus-wide) — false positive

Sweep id `A.6.1.1.*.2.2.2.2.1.2.1.1#structural-total`, deterministic pass, category `structural`. Spark (A.6.1.1.1.2.2.2.2.1.2.1.1) and Grove use total supply consistently within their own doc; per-agent Root Edit thresholds may differ and nothing in the text says they must match.

Root Edit Proposal Submission · A.6.1.1.1.2.2.2.2.1.2.1.1:

> A SPK token holder must hold at least 1% of the total token supply to submit a proposal.

Root Edit Proposal Submission · A.6.1.1.3.2.2.2.2.1.2.1.1:

> A KEEL token holder must hold at least 1% of the circulating token supply to submit a proposal.

**Action:** rejected.

### 65. A.6.1.1.*.2.2.2.2.1.2.3 (corpus-wide) — false positive

Sweep id `A.6.1.1.*.2.2.2.2.1.2.3#structural-urgent`, deterministic pass, category `structural`. Each agent's Emergency Protocol matches its own child: Obex's A.6.1.1.5.2.2.2.2.1.2.3.1 covers only Emergency Situations, Spark's A.6.1.1.1.2.2.2.2.1.2.3.1 covers Urgent and Emergency; a per-agent difference, not a defect.

Root Edit Voting Process in Emergency Situations · A.6.1.1.5.2.2.2.2.1.2.3.1:

> In an Emergency Situation, as defined by the Sky Core Atlas

Root Edit Voting Process in Urgent and Emergency Situations · A.6.1.1.1.2.2.2.2.1.2.3.1:

> In an Urgent or Emergency Situation, as defined by the Sky Core Atlas

**Action:** rejected.

### 67. A.6.1.1.*.2.3.2 (corpus-wide) — duplicate

Sweep id `A.6.1.1.*.2.3.2#structural-groves`, deterministic pass, category `structural`. A.6.1.1.2.2.3.2 uses "Groves" where the possessive "Grove's" is meant (other agents write e.g. "Spark’s Instances"); a missing apostrophe, i.e. a typo.

Upkeep Rebate Primitive · A.6.1.1.2.2.3.2:

> for Groves Instance of the Upkeep Rebate Primitive

Corrected fix: `In A.6.1.1.2.2.3.2 replace "Groves" with "Grove's".`

**Action:** rejected (duplicate of `A.6.1.1.2.2.3.2#grammar`).

### 69. A.6.1.1.*.2.5.1.1 (corpus-wide) — duplicate

Sweep id `A.6.1.1.*.2.5.1.1#structural-groves`, deterministic pass, category `structural`. A.6.1.1.2.2.5.1.1 uses "Groves" where the possessive "Grove's" is meant (other agents write e.g. "Spark’s Instances"); a missing apostrophe, i.e. a typo.

Primitive Hub Document · A.6.1.1.2.2.5.1.1:

> relevant to Groves usage of the Distribution Reward Primitive

Corrected fix: `In A.6.1.1.2.2.5.1.1 replace "Groves" with "Grove's".`

**Action:** rejected (duplicate of `A.6.1.1.2.2.5.1.1#grammar`).

### 73. A.6.1.1.*.2.6.1.1.4 (corpus-wide) — duplicate

Sweep id `A.6.1.1.*.2.6.1.1.4#structural-toa61126112`, deterministic pass, category `structural`. A.6.1.1.3.2.6.1.1.4 is missing the space between "to" and the link; the link target itself matches the other agents, so this is a typo, not structural.

In Progress Invocations Directory · A.6.1.1.3.2.6.1.1.4:

> moved to[A.6.1.1.3.2.6.1.1.2 - Active Instances Directory]

Corrected fix: `In A.6.1.1.3.2.6.1.1.4 insert a space: "moved to[A.6.1.1.3.2.6.1.1.2" -> "moved to [A.6.1.1.3.2.6.1.1.2".`

**Action:** rejected (duplicate of `A.6.1.1.3.2.6.1.1.4#markdown`).

### 74. A.6.1.1.*.2.6.1.2.2.3 (corpus-wide) — false positive

Sweep id `A.6.1.1.*.2.6.1.2.2.3#structural-event`, deterministic pass, category `structural`. "in the event of" vs "in case of" is harmless wording variation; Osero's A.6.1.1.7.2.6.1.2.2.3 has since been rewritten to point to A.2.2.10.1.1.1.2.5.4 anyway.

Emergency Protocol · A.6.1.1.7.2.6.1.2.2.3:

> The actions that can be taken in the event of an emergency within Osero Liquidity Layer operations are specified in

**Action:** rejected.

### 75. A.6.1.1.*.2.6.1.3.1.1.1.2.4 (corpus-wide) — false positive

Sweep id `A.6.1.1.*.2.6.1.3.1.1.1.2.4#structural-deposit`, deterministic pass, category `structural`. Keel's A.6.1.1.3.2.6.1.3.1.1.1.2.4 says deposit and withdrawal because its children are a Deposit Rate Limit and a Withdrawal Rate Limit; accurate per-instance wording, not a defect.

Rate Limits · A.6.1.1.3.2.6.1.3.1.1.1.2.4:

> The current `maxAmount` and `slope` for this conduit’s deposit and withdrawal are defined in the subdocuments herein.

Deposit Rate Limit · A.6.1.1.3.2.6.1.3.1.1.1.2.4.1:

> The deposit rate limit parameters are:

**Action:** rejected.

### 77. A.6.1.1.*.2.6.3 (corpus-wide) — duplicate

Sweep id `A.6.1.1.*.2.6.3#structural-groves`, deterministic pass, category `structural`. A.6.1.1.2.2.6.3 uses "Groves" where the possessive "Grove's" is meant (other agents write e.g. "Spark’s Instances"); a missing apostrophe, i.e. a typo.

Asset Liability Management Rental Primitive · A.6.1.1.2.2.6.3:

> for Groves Instances of the Asset Liability Management Rental Primitive

Asset Liability Management Rental Primitive · A.6.1.1.1.2.6.3:

> for Spark’s Instances of the Asset Liability Management Rental Primitive

Corrected fix: `In A.6.1.1.2.2.6.3 replace "Groves" with "Grove's".`

**Action:** rejected (duplicate of `A.6.1.1.2.2.6.3#typo`).

### 80. A.6.1.1.1.2.1.1.3 Completed Instances Directory — real, re-filed

Sweep id `A.6.1.1.1.2.1.1.3#structural` (`5eff8c9f-8499-41ff-9aed-2e31d9f5f139`), factual pass, category `structural`. A.6.1.1.1.2.1.1.3 is titled 'Completed Instances Directory', duplicating hub doc A.6.1.1.1.2.1.1.1.3, while the same slot is 'Completed Instances' in A.6.1.1.1.2.1.2.3/.3.3/.4.3.

Completed Instances Directory · A.6.1.1.1.2.1.1.3:

> Completed Instances Directory

Completed Instances Directory · A.6.1.1.1.2.1.1.1.3:

> Completed Instances Directory

Completed Instances · A.6.1.1.1.2.1.2.3:

> Completed Instances

**Action:** re-filed as `naming`.

### 81. A.6.1.1.1.2.1.1.4 In Progress Invocations Directory — real, re-filed

Sweep id `A.6.1.1.1.2.1.1.4#structural` (`1974618c-b054-41c3-a6aa-860ea7875d02`), factual pass, category `structural`. A.6.1.1.1.2.1.1.4 is titled 'In Progress Invocations Directory', the same as hub doc A.6.1.1.1.2.1.1.1.4; sibling primitives use 'In Progress Invocations' (A.6.1.1.1.2.1.2.4).

In Progress Invocations Directory · A.6.1.1.1.2.1.1.4:

> In Progress Invocations Directory

In Progress Invocations Directory · A.6.1.1.1.2.1.1.1.4:

> In Progress Invocations Directory

In Progress Invocations · A.6.1.1.1.2.1.2.4:

> In Progress Invocations

**Action:** re-filed as `naming`.

### 82. A.6.1.1.1.2.6.1.1.2.1.4.4 Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document Location — real

Sweep id `A.6.1.1.1.2.6.1.1.2.1.4.4#naming` (`3dabe1bb-244d-4546-993a-449b988d9199`), language pass, category `naming`. A.6.1.1.1.2.6.1.1.2.1.4.4 names the instance "Spark Savings v2 PYUSD" but links a document titled "spPYUSD". The sibling ICDs (ETH, USDC, USDT) use the plain token name.

Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document Location · A.6.1.1.1.2.6.1.1.2.1.4.4:

> Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document Location

Ethereum Mainnet - Spark Savings v2 spPYUSD Instance Configuration Document · A.6.1.1.1.2.6.1.3.1.4.4:

> Ethereum Mainnet - Spark Savings v2 spPYUSD Instance Configuration Document

Ethereum Mainnet - Spark Savings v2 USDT Instance Configuration Document · A.6.1.1.1.2.6.1.3.1.4.3:

> Ethereum Mainnet - Spark Savings v2 USDT Instance Configuration Document

Corrected fix: `Rename A.6.1.1.1.2.6.1.3.1.4.4 to "Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document" (siblings .4.1-.4.3 name the underlying token) and update the link text in A.6.1.1.1.2.6.1.1.2.1.4.4.`

**Action:** kept, fix corrected.

### 83. A.6.1.1.1.2.6.1.1.2.1.4.4 Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document Location — duplicate

Sweep id `A.6.1.1.1.2.6.1.1.2.1.4.4#xref` (`3dabe1bb-244d-4546-993a-449b988d9199`), factual pass, category `xref`. The link label matches its target A.6.1.1.1.2.6.1.3.1.4.4's title, so the xref resolves; the defect is inconsistent naming (PYUSD vs spPYUSD) between this Location doc and the ICD.

Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document Location · A.6.1.1.1.2.6.1.1.2.1.4.4:

> Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document Location

Ethereum Mainnet - Spark Savings v2 spPYUSD Instance Configuration Document · A.6.1.1.1.2.6.1.3.1.4.4:

> Ethereum Mainnet - Spark Savings v2 spPYUSD Instance Configuration Document

Corrected fix: `Use one name for the instance: retitle A.6.1.1.1.2.6.1.3.1.4.4 'Ethereum Mainnet - Spark Savings v2 PYUSD Instance Configuration Document' (matching ETH/USDC/USDT siblings) and update this link label to match.`

**Action:** rejected (duplicate of `A.6.1.1.1.2.6.1.1.2.1.4.4#naming`).

### 84. A.6.1.1.1.2.6.1.1.2.4.1 Spark Savings V2 — real, re-filed

Sweep id `A.6.1.1.1.2.6.1.1.2.5.1#markdown` (`d0cbb95a-5115-4a9a-a67e-cc00172beef5`), language pass, category `markdown`. A.6.1.1.1.2.6.1.1.2.4.1 (renumbered) has no closing period, unlike the same boilerplate in its siblings, e.g. A.6.1.1.1.2.6.1.1.2.3.1. A missing period is punctuation, not markdown.

Spark Savings V2 · A.6.1.1.1.2.6.1.1.2.4.1:

> The Robinhood Chain Instances Directory of the Spark Savings v2 Protocol with `Active` Status are stored herein

Spark Savings V2 · A.6.1.1.1.2.6.1.1.2.3.1:

> The Arbitrum Instances Directory of the Spark Savings v2 Protocol with `Active` Status are stored herein.

**Action:** re-filed as `typo`, severity high.

### 85. A.6.1.1.1.2.6.1.1.2.5.1 Spark Savings V2 — real, re-filed

Sweep id `A.6.1.1.1.2.6.1.1.2.6.1#markdown` (`70c70fa9-9cb4-4bcf-a62f-b815a90981c3`), language pass, category `markdown`. A.6.1.1.1.2.6.1.1.2.5.1 (renumbered) has no closing period, unlike the same boilerplate in its sibling A.6.1.1.1.2.6.1.1.2.5.2. A missing period is punctuation, not markdown.

Spark Savings V2 · A.6.1.1.1.2.6.1.1.2.5.1:

> The X Layer Instances Directory of the Spark Savings v2 Protocol with `Active` Status are stored herein

Morpho · A.6.1.1.1.2.6.1.1.2.5.2:

> The X Layer Instances Directory of the Morpho Protocol with `Active` Status are stored herein.

**Action:** re-filed as `typo`, severity high.

### 87. A.6.1.1.1.2.6.1.2.1.1.3.7.2 USDG Robinhood Chain ALM Proxy Maximum — real

Sweep id `A.6.1.1.1.2.6.1.2.1.1.3.7.2#entity` (`bb47f741-e64b-440c-822c-3937fe94e87e`), factual pass, category `entity`. A.6.1.1.1.2.6.1.2.1.1.3.7.2 says the limit governs USDG sent to the Robinhood Chain ALM Proxy, but its Recipient differs from the ALM_PROXY address in A.6.1.1.1.2.6.1.2.1.1.1.2.7.5 and appears nowhere else.

USDG Robinhood Chain ALM Proxy Maximum · A.6.1.1.1.2.6.1.2.1.1.3.7.2:

> Recipient: `0xf752cF318dfF2C01575c98741AA52e7a34d873Fd`

ALM Proxy (Robinhood Chain) Contract · A.6.1.1.1.2.6.1.2.1.1.1.2.7.5:

> The address of the ALM_PROXY contract is: `0xfD2fD4B046136B540A56C11c75ac679AE7d1dB24`

**Action:** kept, severity low.

### 88. A.6.1.1.1.2.6.1.2.1.2.2.2.3 Signers — real

Sweep id `A.6.1.1.1.2.6.1.2.1.2.2.2.3#governance` (`1563f1ee-0097-4bb3-a03a-01162d00788b`), factual pass, category `governance`. 2/5 lets Soter Labs' or SAF's 2 signers act alone despite 'jointly controlled' (A.6.1.1.1.2.6.1.2.1.2.2.2), and it breaks the >=2/3 rule in A.6.1.1.1.2.6.1.2.1.2.2.2.5; 3/5 would still fall short.

Signers · A.6.1.1.1.2.6.1.2.1.2.2.2.3:

> execution requires meeting the 2/5 threshold

Core Operator Relayer Multisig · A.6.1.1.1.2.6.1.2.1.2.2.2:

> is jointly controlled by Operational GovOps Soter Labs and the Spark Assets Foundation

Modification · A.6.1.1.1.2.6.1.2.1.2.2.2.5:

> at least two-thirds of signers are required to execute transactions

Corrected fix: `Raise the threshold to at least 4/5 (two-thirds of 5 signers, per A.6.1.1.1.2.6.1.2.1.2.2.2.5), which also forces at least two parties to sign; or amend the Modification rule and the 'jointly controlled' wording.`

**Action:** kept, fix corrected.

### 93. A.6.1.1.1.2.6.1.3.1.4.4.4.1.3 Setter — real

Sweep id `A.6.1.1.1.2.6.1.3.1.6.4.4.1.3#entity` (`2ece6e1d-b07a-4df5-9aa6-616756f64815`), factual pass, category `entity`. The spPYUSD Setter (now A.6.1.1.1.2.6.1.3.1.4.4.4.1.3) is the ALM Proxy Freezable, unlike the Spark Operations Multisig used by the ETH/USDC/USDT siblings; this may be deliberate.

Setter · A.6.1.1.1.2.6.1.3.1.4.4.4.1.3:

> `0x9Ad87668d49ab69EEa0AF091de970EF52b0D5178`

Setter · A.6.1.1.1.2.6.1.3.1.4.1.4.1.3:

> `0x2E1b01adABB8D4981863394bEa23a1263CBaeDfC`

ALM Proxy Freezable (Mainnet) Contract Address · A.6.1.1.1.2.6.1.2.1.1.1.2.1.7:

> The address of the ALM_PROXY_FREEZABLE contract is: `0x9Ad87668d49ab69EEa0AF091de970EF52b0D5178`

**Action:** kept, severity low.

### 94. A.6.1.1.1.2.6.1.3.1.6.5.2.1.4 Token — false positive

Sweep id `A.6.1.1.1.2.6.1.3.1.6.5.2.1.4#typo` (`c7b6ad97-5e83-488d-8aad-19a7ed272765`), language pass, category `typo`. Every sibling Uniswap v4 Token parameter (A.6.1.1.1.2.6.1.3.1.6.1-.6.4 .2.1.4) concatenates the pair, as in PYUSDUSDS and USDTUSDS, so OUSDUSDS follows house style. The slash form appears only in rate-limit text.

Token · A.6.1.1.1.2.6.1.3.1.6.5.2.1.4:

> OUSDUSDS

Token · A.6.1.1.1.2.6.1.3.1.6.1.2.1.4:

> PYUSDUSDS

Token · A.6.1.1.1.2.6.1.3.1.6.2.2.1.4:

> USDTUSDS

**Action:** rejected.

### 95. A.6.1.1.1.2.6.1.3.1.6.5.2.4 Rate Limits — real

Sweep id `A.6.1.1.1.2.6.1.3.1.6.5.2.4#markdown` (`908bf4b2-0b28-4e2f-8928-4a4dd867b33f`), language pass, category `markdown`. A.6.1.1.1.2.6.1.3.1.6.5.2.4 puts the comma inside the code span (`maxAmount,`); the parallel A.6.1.1.1.2.6.1.4.1.6.3.2.4 writes `maxAmount`, outside the backticks.

Rate Limits · A.6.1.1.1.2.6.1.3.1.6.5.2.4:

> `maxAmount,` `slope`

Rate Limits · A.6.1.1.1.2.6.1.4.1.6.3.2.4:

> The current `maxAmount`, `slope` and slippage

**Action:** kept, severity high.

### 96. A.6.1.1.1.2.6.1.3.2.1.1.3 Instance-specific Operational Processes — real

Sweep id `A.6.1.1.1.2.6.1.3.2.1.1.3#xref` (`9b849363-5380-406f-888a-d533f6ec69de`), factual pass, category `xref`. Base instance A.6.1.1.1.2.6.1.3.2.1.1.3 links Mainnet Controller docs, but Base instances such as A.6.1.1.1.2.6.1.4.2.1.1.3 link the Foreign Controller ERC-4626 Functions and A...2.2.3.2.1; both links need changing.

Instance-specific Operational Processes · A.6.1.1.1.2.6.1.3.2.1.1.3:

> for emergency procedures see [A.6.1.1.1.2.6.1.2.2.3.4.1 - ERC-4626 Withdrawal Action](f92ddc3f-672a-4f52-931f-5263a9f709b9)

ERC-4626 Withdrawal Action · A.6.1.1.1.2.6.1.2.2.3.4.1:

> mainnetController.redeemERC4626(address(token), token.balanceOf(address(proxy)), minAssetsOut)

Instance-specific Operational Processes · A.6.1.1.1.2.6.1.4.2.1.1.3:

> for emergency procedures, [A.6.1.1.1.2.6.1.2.2.3.2.1 - ERC

Corrected fix: `The Instance follows the general ERC4626 procedures see [A.6.1.1.1.2.6.1.2.2.1.2.2.2.1 - ERC-4626 Functions](f9225946-9172-4013-bd04-5e032a998e05) and for emergency procedures see [A.6.1.1.1.2.6.1.2.2.3.2.1 - ERC-4626 Withdrawal Action](aad3683d-38d4-4e94-b2bf-88b408c2290e).`

**Action:** kept, fix corrected.

### 97. A.6.1.1.1.2.6.1.3.5.2.1.4.1.2 Sentinel Role Addresses — real

Sweep id `A.6.1.1.1.2.6.1.3.5.2.1.4.1.2#entity` (`13a93238-d281-46d4-a7ff-8806c0edbd32`), factual pass, category `entity`. The two entity attributions conflict, but the Sentinel row is right: every other curator table (e.g. A.6.1.1.1.2.6.1.3.1.3.1.4.1.1) gives 0x50c7 as Spark, so the swap is in the sibling A.6.1.1.1.2.6.1.3.5.2.1.4.1.1.

Sentinel Role Addresses · A.6.1.1.1.2.6.1.3.5.2.1.4.1.2:

> | Spark | `0x50c770E6dC6CfdEE33509273FA9a215bfAffF9B2` |

Curator Role Address · A.6.1.1.1.2.6.1.3.5.2.1.4.1.1:

> | Soter Labs | `0x50c770E6dC6CfdEE33509273FA9a215bfAffF9B2` |

Curator Role Address · A.6.1.1.1.2.6.1.3.1.3.1.4.1.1:

> | Spark | `0x50c770E6dC6CfdEE33509273FA9a215bfAffF9B2` |

Corrected fix: `Leave this Sentinel row as is. Swap the Soter Labs/Spark rows in the sibling Curator doc A.6.1.1.1.2.6.1.3.5.2.1.4.1.1 (Soter Labs 0xAB57...38Eb, Spark 0x50c7...F9B2), as in every other Spark curator table.`

**Action:** kept, fix corrected.

### 98. A.6.1.1.1.2.6.1.4.1.6.3.2.4.1 Inflow Rate Limit — real

Sweep id `A.6.1.1.1.2.6.1.4.1.6.3.2.4.1#grammar` (`893256f7-00f6-42e7-92cd-218af9beac76`), language pass, category `grammar`. A.6.1.1.1.2.6.1.4.1.6.3.2.4.1 says 'parameter is' before a two-item list; every sibling (e.g. A.6.1.1.1.2.6.1.4.1.6.2.2.4.1) says 'parameters are'.

Inflow Rate Limit · A.6.1.1.1.2.6.1.4.1.6.3.2.4.1:

> The inflow rate limit parameter is:

Inflow Rate Limit · A.6.1.1.1.2.6.1.4.1.6.2.2.4.1:

> The inflow rate limit parameters are:

**Action:** kept, severity high.

### 99. A.6.1.1.1.2.6.1.4.1.6.3.2.4.2 Outflow Rate Limit — real

Sweep id `A.6.1.1.1.2.6.1.4.1.6.3.2.4.2#grammar` (`dfcceae6-65f0-44e2-9d47-9ad2324d983d`), language pass, category `grammar`. A.6.1.1.1.2.6.1.4.1.6.3.2.4.2 says 'parameter is' before a two-item list; siblings such as A.6.1.1.1.2.6.1.4.1.6.2.2.4.2 say 'parameters are'.

Outflow Rate Limit · A.6.1.1.1.2.6.1.4.1.6.3.2.4.2:

> The outflow rate limit parameter is:

Outflow Rate Limit · A.6.1.1.1.2.6.1.4.1.6.2.2.4.2:

> The outflow rate limit parameters are:

**Action:** kept, severity high.

### 100. A.6.1.1.1.2.6.1.4.1 Ethereum Mainnet Instances — fixed upstream

Sweep id `A.6.1.1.1.2.6.1.4.3#structural` (`4a98960f-dd05-4f2b-9e7c-66a489ee499a`), factual pass, category `structural`. The container is now A.6.1.1.1.2.6.1.4.1, and the Blackrock and Centrifuge groups sit inside it as A.6.1.1.1.2.6.1.4.1.8 and .9.

Blackrock · A.6.1.1.1.2.6.1.4.1.8:

> The Ethereum Mainnet Instances of the Blackrock Protocol with `Completed` Status are stored herein.

Centrifuge · A.6.1.1.1.2.6.1.4.1.9:

> The Ethereum Mainnet Instances of the Centrifuge Protocol with `Completed` Status are stored herein.

**Action:** rejected.

### 101. A.6.1.1.1.3.1.3.3.4.1 Disclosure Of Conflicts — real, re-filed

Sweep id `A.6.1.1.1.3.1.3.3.4.1#structural` (`cfdf3c2d-6ede-49f0-8f2c-0cd91a5602bc`), factual pass, category `structural`. A.6.1.1.1.3.1.3.3.4.1 says 'disclosed to both the Spark Foundation' but names only one recipient, so either a second party is missing or 'both' is stray.

Disclosure Of Conflicts · A.6.1.1.1.3.1.3.3.4.1:

> Conflicts must be disclosed to both the Spark Foundation before the voting window

**Action:** re-filed as `grammar`.

### 102. A.6.1.1.1.3.2.1.1.3.2.2 SparkLend Cap Automator wstETH Parameters — false positive

Sweep id `A.6.1.1.1.3.2.1.1.3.2.2#numeric` (`93b851d7-9825-4022-a583-51a4bbdf4f9c`), factual pass, category `numeric`. A borrow-cap max of 1 with a larger gap is a deliberate pattern: rETH (A.6.1.1.1.3.2.1.1.3.2.3) has the same shape and also lists Borrowing: Yes (A.6.1.1.1.3.2.1.1.2.1.11); max simply bounds the automator.

SparkLend Cap Automator rETH Parameters · A.6.1.1.1.3.2.1.1.3.2.3:

> Borrow cap
>     - `gap`: 100 rETH
>     - `ttl`: 12 hours
>     - `max`: 1 rETH

rETH Risk Parameters · A.6.1.1.1.3.2.1.1.2.1.11:

> Borrow Cap: Set by cap automator

**Action:** rejected.

### 103. A.6.1.1.1.3.4.2.2.2 Evaluation Method — real, re-filed

Sweep id `A.6.1.1.1.3.4.2.2.2#xref` (`99d4b8da-fa5c-49ce-b93c-70d07334d7aa`), factual pass, category `xref`. The link target is right (A.6.1.1.1.3.4.2.1 holds the ratio), but 'Risk Tolerance Ratio' is a stale name: the Parameters doc A.6.1.1.1.3.4.2.1.3 names it the 'Target Encumbrance Ratio'.

Evaluation Method · A.6.1.1.1.3.4.2.2.2:

> divided by Risk Tolerance Ratio

Parameters · A.6.1.1.1.3.4.2.1.3:

> The current Target Encumbrance Ratio is 90%.

Corrected fix: `divided by the Target Encumbrance Ratio ([A.6.1.1.1.3.4.2.1 - Encumbrance Ratio](9995ba51-1de7-4b32-8b76-a71462dc4c5b))`

**Action:** re-filed as `naming`, fix corrected.

### 104. A.6.1.1.1.3.10.3 Permitted Actions — real

Sweep id `A.6.1.1.1.3.10.3#naming` (`56281438-63f9-46d4-a382-39a790a3bba1`), language pass, category `naming`. A.6.1.1.1.3.10.3 uses 'Confidential Strategic Integration and Deployment' earlier in the same document, then 'Strategic Partnership and Deployment' once; the A.6.1.1.1.3.10 framework never uses 'Partnership'.

Permitted Actions · A.6.1.1.1.3.10.3:

> operational readiness of a Confidential Strategic Integration and Deployment

Permitted Actions · A.6.1.1.1.3.10.3:

> voluntarily deposited by users into a Confidential Strategic Partnership and Deployment

**Action:** kept, severity high.

### 105. A.6.1.1.2.2.1.1.3 Completed Instances Directory — real, re-filed

Sweep id `A.6.1.1.2.2.1.1.3#structural` (`994395c0-c61d-4fc9-8167-00ee3134bd5a`), factual pass, category `structural`. The container is titled 'Completed Instances Directory', the same title as the hub directory A.6.1.1.2.2.1.1.1.3, while sibling primitives name the slot 'Completed Instances' (A.6.1.1.2.2.1.2.3). The defect is a title, not structure.

Completed Instances Directory · A.6.1.1.2.2.1.1.3:

> Completed Instances Directory

Completed Instances · A.6.1.1.2.2.1.2.3:

> The Instances of the Prime Transformation Primitive with `Completed` Status are contained herein.

Completed Instances Directory · A.6.1.1.2.2.1.1.1.3:

> This document contains a Directory of all Instances of the Agent Creation Primitive with Instance status of `Completed`.

**Action:** re-filed as `naming`.

### 106. A.6.1.1.2.2.6.1.2.1.1.3.1.2.3 Maximum USDC Bridged From Avalanche To Ethereum Mainnet Via Circle CCTP — false positive

Sweep id `A.6.1.1.2.2.6.1.2.1.1.3.1.2.3#numeric` (`a3b52620-db3f-40fa-80d5-a7eacf52090c`), factual pass, category `numeric`. 'slope: Unlimited' alongside 'maxAmount: Unlimited' is a common convention across the rate-limit tables, e.g. A.6.1.1.3.2.6.1.2.1.1.3.1.1.2 and A.6.1.1.1.2.6.1.2.1.1.3.6.1.

USDS Burn Maximum · A.6.1.1.3.2.6.1.2.1.1.3.1.1.2:

> - `maxAmount`: Unlimited
> - `slope`: Unlimited

Avalanche USDC Deposit Maximum · A.6.1.1.1.2.6.1.2.1.1.3.6.1:

> - `maxAmount`: Unlimited
> - `slope`: Unlimited

**Action:** rejected.

### 107. A.6.1.1.2.2.6.1.3.1.1.3.2.5.1 Maximum Exposure — false positive

Sweep id `A.6.1.1.2.2.6.1.3.1.1.3.2.5.1#numeric` (`96e8ca2f-4e71-4ab0-ba0f-1958ea8e637b`), factual pass, category `numeric`. Grove states Maximum Exposure caps in USDS whatever the supplied asset: the USDG (A.6.1.1.2.2.6.1.3.7.1.1.2.5.1) and USDC/AUSD (A.6.1.1.2.2.6.1.3.1.12.3.2.5.1) Instances do the same, so USDS is the unit of account here.

Maximum Exposure · A.6.1.1.2.2.6.1.3.7.1.1.2.5.1:

> Total USDG exposure may not exceed 100 million USDS.

Maximum Exposure · A.6.1.1.2.2.6.1.3.1.12.3.2.5.1:

> Total exposure through this Instance may not exceed 100,000,000 USDS.

**Action:** rejected.

### 108. A.6.1.1.2.2.6.1.3.2.1.1.2.2.1 Token Address — false positive

Sweep id `A.6.1.1.2.2.6.1.3.2.1.1.2.2.1#entity` (`f9f790ea-f67a-4e6d-ac63-cd84faf208fe`), factual pass, category `entity`. The address is still present, so this is not fixed, but the Ethereum Centrifuge JTRSY ICD (A.6.1.1.2.2.6.1.3.1.1.1.2.2.1) also gives 0xFE69…d77A as its 'Token Address'. The Avalanche doc follows that convention, and the text cannot show the address is wrong.

Token Address · A.6.1.1.2.2.6.1.3.2.1.1.2.2.1:

> `0xFE6920eB6C421f1179cA8c8d4170530CDBdfd77A`

Token Address · A.6.1.1.2.2.6.1.3.1.1.1.2.2.1:

> `0xFE6920eB6C421f1179cA8c8d4170530CDBdfd77A`

**Action:** rejected.

### 110. A.6.1.1.2.2.6.1.3.7.2.1.2.2.1 Token Address — false positive

Sweep id `A.6.1.1.2.2.6.1.3.7.2.1.2.2.1#entity` (`82df3c6c-85a2-4ba2-917f-f3ea230b610d`), factual pass, category `entity`. In Paxos conversion ICDs, Token Address = Underlying = the supplied asset, not the received one: e.g. the Grove USDC-to-USDG Instance A.6.1.1.2.2.6.1.3.1.15.1.2.2.1 lists the USDC address.

Token Address · A.6.1.1.2.2.6.1.3.1.15.1.2.2.1:

> `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

Token to Receive · A.6.1.1.2.2.6.1.3.1.15.1.2.1.4:

> USDG

Asset Supplied By Grove Liquidity Layer · A.6.1.1.2.2.6.1.3.7.2.1.2.1.3:

> USDG

**Action:** rejected.

### 111. A.6.1.1.2.3.6.7 Authorization To Subscribe And Purchase Notes Issued By Galaxy CLO — duplicate

Sweep id `A.6.1.1.2.3.6.7#xref` (`db2e4893-d315-4a65-a5cc-133d7763c693`), factual pass, category `xref`. The link target in A.6.1.1.2.3.6.7 starts 'ttps://' (missing h), so it does not match its link text and will not resolve.

Authorization To Subscribe And Purchase Notes Issued By Galaxy CLO · A.6.1.1.2.3.6.7:

> (ttps://gateway.pinata.cloud/ipfs/bafkreierc3rxu3d64xakeeibkqujkqbhlz3lcsnjymcckaacix55vhya6u)

**Action:** rejected (duplicate of `A.6.1.1.2.3.6.7#markdown`).

### 112. A.6.1.1.3.2.1.1.3 Completed Instances Directory — real, re-filed

Sweep id `A.6.1.1.3.2.1.1.3#structural` (`0b9ec93a-58c8-48cf-b88f-ebbbc3a4333b`), factual pass, category `structural`. The container is titled 'Completed Instances Directory' (the same title as the hub directory A.6.1.1.3.2.1.1.1.3), while sibling A.6.1.1.3.2.1.2.3 is 'Completed Instances'. The defect is a title.

Completed Instances Directory · A.6.1.1.3.2.1.1.3:

> Completed Instances Directory

Completed Instances · A.6.1.1.3.2.1.2.3:

> Completed Instances

**Action:** re-filed as `naming`.

### 113. A.6.1.1.3.2.3.2.2.1.2.1.3 Operational GovOps Reviews Rebate — real, re-filed

Sweep id `A.6.1.1.3.2.3.2.2.1.2.3#markdown` (`77ad2a49-8fa6-499b-bd26-b9fdef57fded`), language pass, category `markdown`. A.6.1.1.3.2.3.2.2.1.2.1.3 (renumbered) ends without a period; this is missing punctuation, not a markdown problem.

Operational GovOps Reviews Rebate · A.6.1.1.3.2.3.2.2.1.2.1.3:

> it must be escalated to Core GovOps

**Action:** re-filed as `typo`.

### 114. A.6.1.1.3.2.6.1.2.1.1.3.1.1.1 USDS Mint Maximum — false positive

Sweep id `A.6.1.1.3.2.6.1.2.1.1.3.1.1.1#numeric` (`568f6fae-4680-4090-8eee-fe0b8e920155`), factual pass, category `numeric`. 10,000 USDS is low but self-consistent (maxAmount and slope agree) and plausibly a deliberate near-zero mint cap. LIMIT_USDS_TO_USDC is not 'unreachable', because USDS can enter other ways. The text alone shows no error.

USDS Mint Maximum · A.6.1.1.3.2.6.1.2.1.1.3.1.1.1:

> - `maxAmount`: 10,000 USDS
> - `slope`: 10,000 USDS per day

**Action:** rejected.

### 115. A.6.1.1.3.2.6.1.2.1.1.3.1.2.1 Ethereum Mainnet sUSDS Deposit Maximum — real, re-filed

Sweep id `A.6.1.1.3.2.6.1.2.1.1.3.1.2.1#numeric` (`28831fcf-2e28-4760-a4cd-27ae538edd9a`), factual pass, category `numeric`. LIMIT_4626_DEPOSIT counts deposited assets (USDS), so the USDS figures are right. The loose phrase 'amount of sUSDS that can be deposited' is the error. Spark's version says 'USDS worth of sUSDS' (A.6.1.1.1.2.6.1.2.1.1.3.3.5).

Ethereum Mainnet sUSDS Deposit Maximum · A.6.1.1.3.2.6.1.2.1.1.3.1.2.1:

> The maximum amount of sUSDS that can be deposited (`LIMIT_4626_DEPOSIT`)

Arbitrum sUSDS Deposit Maximum · A.6.1.1.1.2.6.1.2.1.1.3.3.5:

> 10,000,000 USDS worth of sUSDS

Corrected fix: `The maximum amount of USDS that can be deposited into sUSDS ('LIMIT_4626_DEPOSIT') is specified in the document herein.`

**Action:** re-filed as `wrong-word`, severity low, fix corrected.

### 116. A.6.1.1.3.2.6.1.2.1.1.3.2.1.2 USDS For USDC Swap Maximum — real

Sweep id `A.6.1.1.3.2.6.1.2.1.1.3.2.1.2#numeric` (`5f86844e-579b-425c-8f7b-e6521cfe55b9`), factual pass, category `numeric`. Only Solana limit at 100M/50M, identical to the Mainnet swap A.6.1.1.3.2.6.1.2.1.1.3.1.1.3, and above the 25M aggregate USDS Reserve cap A.6.1.1.3.2.6.1.2.1.1.3.2.1.1; likely copy-paste, though the Reserve still binds.

USDS For USDC Swap Maximum · A.6.1.1.3.2.6.1.2.1.1.3.2.1.2:

> - `maxAmount`: 100,000,000 USDS
> - `slope`: 50,000,000 USDS per day

USDS Reserve · A.6.1.1.3.2.6.1.2.1.1.3.2.1.1:

> - `maxAmount`: 25,000,000 USDS
> - `slope`: 10,000,000 USDS per day

**Action:** kept, severity low.

### 117. A.6.1.1.3.2.6.1.2.1.2.3.1.5 Modification — real

Sweep id `A.6.1.1.3.2.6.1.2.1.2.3.1.5#grammar` (`e7492c8c-10b6-4ee1-9d62-fb3c292f1308`), language pass, category `grammar`. A.6.1.1.3.2.6.1.2.1.2.3.1.5 pairs the plural subject 'Changes' with the singular 'is a controller action'.

Modification · A.6.1.1.3.2.6.1.2.1.2.3.1.5:

> Changes to the Prime Relayer Addresses is a controller action which must be invoked by a

Corrected fix: `Changes to the Prime Relayer Addresses are controller actions which must be invoked by a`

**Action:** kept, severity high, fix corrected.

### 121. A.6.1.1.3.2.6.1.2.2.2.1.1.2 Relayer Role — real

Sweep id `A.6.1.1.3.2.6.1.2.2.2.1.1.2#naming` (`2b42015c-c76a-4364-b8b5-c9a2b9f6f484`), language pass, category `naming`. A.6.1.1.3.2.6.1.2.2.2.1.1.2 writes 'Relayer role' and then 'Relayer Role' in the same paragraph; sibling A.6.1.1.3.2.6.1.2.2.2.1.1.3 keeps 'Freezer role' lowercase. This is cosmetic.

Relayer Role · A.6.1.1.3.2.6.1.2.2.2.1.1.2:

> The Relayer role is the address(es)

Relayer Role · A.6.1.1.3.2.6.1.2.2.2.1.1.2:

> The Relayer Role has `can_execute_swap` and `can_reallocate` permissions.

**Action:** kept, severity low.

### 122. A.6.1.1.3.2.6.1.2.2.2.1.1.3 Freezer Role — real

Sweep id `A.6.1.1.3.2.6.1.2.2.2.1.1.3#typo` (`6f7becc7-2e70-44e5-8662-25ba7dd1a5f8`), language pass, category `typo`. A.6.1.1.3.2.6.1.2.2.2.1.1.3 has a stray space before the comma after `can_freeze_controller`.

Freezer Role · A.6.1.1.3.2.6.1.2.2.2.1.1.3:

> `can_freeze_controller` , `can_suspend_permissions`

**Action:** kept, severity high.

### 123. A.6.1.1.3.2.6.1.2.2.2.3.2.1 Full Freeze — real

Sweep id `A.6.1.1.3.2.6.1.2.2.2.3.2.1#grammar` (`4f8c8aa3-fffc-46dd-aeb7-b23e996619d7`), language pass, category `grammar`. A.6.1.1.3.2.6.1.2.2.2.3.2.1 combines 'nor' with 'cannot', a double negative with no 'neither'; the fix 'and' gives the intended meaning.

Full Freeze · A.6.1.1.3.2.6.1.2.2.2.3.2.1:

> Integrations, Reserves nor Permissions cannot be managed during this period

**Action:** kept, severity high.

### 125. A.6.1.1.4.2.1.1.3 Completed Instances Directory — real, re-filed

Sweep id `A.6.1.1.4.2.1.1.3#structural` (`87ad87f5-5441-4003-8029-b7ce10442119`), factual pass, category `structural`. A.6.1.1.4.2.1.1.3 holds the Instances but is titled like the hub Directory A.6.1.1.4.2.1.1.1.3; sibling A.6.1.1.4.2.1.2.3 is 'Completed Instances'. Title-only defect (template-wide across Agent Creation Primitives).

Completed Instances Directory · A.6.1.1.4.2.1.1.3:

> The Instances of the Agent Creation Primitive with `Completed` Status are contained herein.

Completed Instances Directory · A.6.1.1.4.2.1.1.1.3:

> This document contains a Directory of all Instances of the Agent Creation Primitive with Instance status of `Completed`.

Completed Instances · A.6.1.1.4.2.1.2.3:

> Completed Instances

**Action:** re-filed as `naming`.

### 126. A.6.1.1.4.2.1.1.4 In Progress Invocations Directory — real, re-filed

Sweep id `A.6.1.1.4.2.1.1.4#structural` (`58ddd7d7-28af-4ca3-ac6a-f5d2105f9e79`), factual pass, category `structural`. A.6.1.1.4.2.1.1.4 duplicates the hub title 'In Progress Invocations Directory' (A.6.1.1.4.2.1.1.1.4); the parallel slot A.6.1.1.4.2.1.2.4 is 'In Progress Invocations'. Title-only defect.

In Progress Invocations Directory · A.6.1.1.4.2.1.1.4:

> In Progress Invocations Directory

In Progress Invocations Directory · A.6.1.1.4.2.1.1.1.4:

> In Progress Invocations Directory

In Progress Invocations · A.6.1.1.4.2.1.2.4:

> In Progress Invocations

**Action:** re-filed as `naming`.

### 128. A.6.1.1.4.2.5.2.2.1.2.1 Routine Protocol — real

Sweep id `A.6.1.1.4.2.5.2.2.1.2.1#xref` (`6fe71ca8-3c28-408e-8b11-3c2fcfcc5778`), factual pass, category `xref`. Euler is an Integration Boost Instance (A.6.1.1.4.2.5.2) but cites the Distribution Reward Near-Term Process A.2.2.9.1.2.1.3.3.1; Curve/Morpho siblings cite A.2.2.9.2.2.1.3.2.1.

Routine Protocol · A.6.1.1.4.2.5.2.2.1.2.1:

> subject to the qualifications specified in [A.2.2.9.1.2.1.3.3.1 - Near-Term Process](05fb732b-de55-4886-81a7-7c5d4c13d2d2)

Routine Protocol · A.6.1.1.4.2.5.2.2.2.2.1:

> subject to the qualifications specified in [A.2.2.9.2.2.1.3.2.1 - Near Term Process](4ab621b4-ef8e-4b01-a6aa-9296601033c5)

Near-Term Process · A.2.2.9.1.2.1.3.3.1:

> In the near term, Operational GovOps calculates the Distribution Reward.

**Action:** kept, severity high.

### 129. A.6.1.1.4.2.5.2.2.3.1.2 Integration Partner Reward Address — false positive (see addendum)

Sweep id `A.6.1.1.4.2.5.2.2.3.1.2#entity` (`b70f1003-1159-4d5b-b362-c37aa11403d3`), factual pass, category `entity`. Morpho (A.6.1.1.4.2.5.2.2.3.1.2) and Curve (A.6.1.1.4.2.5.2.2.2.1.2) list the identical partner reward address while every other Integration Partner Reward Address is unique; likely copy-paste, unverifiable from text.

Integration Partner Reward Address · A.6.1.1.4.2.5.2.2.3.1.2:

> The reward address for the Morpho Integration Boost is `0xa7843f843d29ca33ba48d9d1335b774eecc328dc`.

Integration Partner Reward Address · A.6.1.1.4.2.5.2.2.2.1.2:

> The reward address for the Curve Integration Boost is `0xa7843f843d29ca33ba48d9d1335b774eecc328dc`.

**Action:** rejected on human review — see the addendum.

### 130. A.6.1.1.4.2.5.2.4.1.3.1 Routine Protocol — real

Sweep id `A.6.1.1.4.2.5.2.4.1.3.1#xref` (`9ad35e12-7bd0-46c8-a753-4a341ab880a2`), factual pass, category `xref`. Compound Integration Boost Invocation cites Distribution Reward Near-Term Process A.2.2.9.1.2.1.3.3.1 instead of Integration Boost's A.2.2.9.2.2.1.3.2.1, as Curve/Morpho do.

Routine Protocol · A.6.1.1.4.2.5.2.4.1.3.1:

> subject to the qualifications specified in [A.2.2.9.1.2.1.3.3.1 - Near-Term Process](05fb732b-de55-4886-81a7-7c5d4c13d2d2)

Routine Protocol · A.6.1.1.4.2.5.2.2.3.2.1:

> subject to the qualifications specified in [A.2.2.9.2.2.1.3.2.1 - Near Term Process](4ab621b4-ef8e-4b01-a6aa-9296601033c5)

Near Term Process · A.2.2.9.2.2.1.3.2.1:

> In the short term, Integration Boost payments are made from the Demand Side Buffer

**Action:** kept, severity high.

### 131. A.6.1.1.5.2.1.1.3 Completed Instances Directory — real, re-filed

Sweep id `A.6.1.1.5.2.1.1.3#structural` (`31bafd0d-b417-4759-88af-7589f9a32518`), factual pass, category `structural`. A.6.1.1.5.2.1.1.3 holds Instances but is titled 'Completed Instances Directory', same as hub doc A.6.1.1.5.2.1.1.1.3; sibling A.6.1.1.5.2.1.2.3 is 'Completed Instances'. Title-only defect.

Completed Instances Directory · A.6.1.1.5.2.1.1.3:

> The Instances of the Agent Creation Primitive with `Completed` Status are contained herein.

Completed Instances Directory · A.6.1.1.5.2.1.1.1.3:

> Completed Instances Directory

Completed Instances · A.6.1.1.5.2.1.2.3:

> Completed Instances

**Action:** re-filed as `naming`.

### 132. A.6.1.1.5.2.6.1.2.1.1.1.2.1 Ethereum Mainnet — real

Sweep id `A.6.1.1.5.2.6.1.2.1.1.1.2.1#structural` (`5d99d731-c3ed-461c-a6ea-50ebd741b3d2`), factual pass, category `structural`. Ethereum Mainnet container A.6.1.1.5.2.6.1.2.1.1.1.2.1 has no children; the ALM contract docs are its siblings .2.2-.2.7, unlike the Allocator side where .1.1 contains .1.1.1-.1.1.5.

Ethereum Mainnet · A.6.1.1.5.2.6.1.2.1.1.1.2.1:

> The documents herein contain the ALM Contract Addresses for the Obex Liquidity Layer on the Ethereum Mainnet.

ALM Controller Contract · A.6.1.1.5.2.6.1.2.1.1.1.2.2:

> The address of the ALM_CONTROLLER (MainnetController) contract is: `0xF2bB664f16E2df4b0c71F9d2cFc386504E795b7A`

Allocator Buffer Contract · A.6.1.1.5.2.6.1.2.1.1.1.1.1.1:

> The address of the ALLOCATOR_BUFFER contract is: `0x51E9681D7a05abFD33EfaFd43e5dd3Afc0093F1D`

**Action:** kept, severity high.

### 133. A.6.1.1.5.2.6.1.2.1.2.1 Invoking New Instances — real, re-filed

Sweep id `A.6.1.1.5.2.6.1.2.1.2.1#grammar` (`f6be405d-fae7-474e-882d-5c98985324b6`), language pass, category `grammar`. Every sibling Prime (e.g. A.6.1.1.6.2.6.1.2.1.2.1) has the same 'process see' wording but links the Operational Process Definition; in A.6.1.1.5.2.6.1.2.1.2.1 the link is lost and only plain text remains.

Invoking New Instances · A.6.1.1.5.2.6.1.2.1.2.1:

> follows the Root Edit process see Operational Process Definition.

Invoking New Instances · A.6.1.1.6.2.6.1.2.1.2.1:

> follows the Root Edit process see [A.6.1.1.6.2.2.2.2.1.2 - Operational Process Definition](0a6525e3-429d-4955-8dac-9fc61f6643f8).

Operational Process Definition · A.6.1.1.5.2.2.2.2.1.2:

> The documents herein define the process for using the Root Edit Primitive to update the Obex Agent Artifact.

Corrected fix: `The governance process to invoke a new Instance of the Allocation System Primitive follows the Root Edit process see [A.6.1.1.5.2.2.2.2.1.2 - Operational Process Definition](ef3c8fc4-d958-492b-bee6-d96b5f972720).`

**Action:** re-filed as `xref`, severity high, fix corrected.

### 134. A.6.1.1.6.2.1.1.3 Completed Instances Directory — real, re-filed

Sweep id `A.6.1.1.6.2.1.1.3#structural` (`b57af67d-e709-41a7-986b-afdd90fd18d1`), factual pass, category `structural`. A.6.1.1.6.2.1.1.3 holds Instances but carries the hub Directory title of A.6.1.1.6.2.1.1.1.3; sibling A.6.1.1.6.2.1.2.3 is 'Completed Instances'. Title-only defect.

Completed Instances Directory · A.6.1.1.6.2.1.1.3:

> The Instances of the Agent Creation Primitive with `Completed` Status are contained herein.

Completed Instances Directory · A.6.1.1.6.2.1.1.1.3:

> This document contains a Directory of all Instances of the Agent Creation Primitive with Instance status of `Completed`.

Completed Instances · A.6.1.1.6.2.1.2.3:

> Completed Instances

**Action:** re-filed as `naming`.

### 135. A.6.1.1.6.2.1.1.4 In Progress Invocations Directory — real, re-filed

Sweep id `A.6.1.1.6.2.1.1.4#structural` (`38aff44f-e8ef-4734-8e11-fb7894d024a5`), factual pass, category `structural`. A.6.1.1.6.2.1.1.4 duplicates hub title 'In Progress Invocations Directory' (A.6.1.1.6.2.1.1.1.4); parallel slot A.6.1.1.6.2.1.2.4 is 'In Progress Invocations'. Title-only defect.

In Progress Invocations Directory · A.6.1.1.6.2.1.1.4:

> In Progress Invocations Directory

In Progress Invocations Directory · A.6.1.1.6.2.1.1.1.4:

> In Progress Invocations Directory

In Progress Invocations · A.6.1.1.6.2.1.2.4:

> In Progress Invocations

**Action:** re-filed as `naming`.

### 136. A.6.1.1.6.2.6.1.1.2.1.2 River — real

Sweep id `A.6.1.1.6.2.6.1.1.2.1.2#grammar` (`efa428ed-6e6b-433a-a7e0-2ae781167940`), language pass, category `grammar`. A.6.1.1.6.2.6.1.1.2.1.2 has a stray 'deals' that breaks the sentence; sibling A.6.1.1.6.2.6.1.1.2.1.1 reads '... of the Maple Protocol with `Active` Status are stored herein.'

River · A.6.1.1.6.2.6.1.1.2.1.2:

> The Ethereum Mainnet Instances Directory of River deals with `Active` Status are stored herein.

Maple · A.6.1.1.6.2.6.1.1.2.1.1:

> The Ethereum Mainnet Instances Directory of the Maple Protocol with `Active` Status are stored herein.

**Action:** kept, severity high.

### 138. A.6.1.1.6.2.6.1.3.1.2 River — real

Sweep id `A.6.1.1.6.2.6.1.3.1.2#grammar` (`2503b3b1-e0cc-477c-95b7-6fdf25a72ea4`), language pass, category `grammar`. A.6.1.1.6.2.6.1.3.1.2 has a stray 'deals' that breaks the sentence; sibling A.6.1.1.6.2.6.1.3.1.1 reads '... of the Maple Protocol with `Active` Status are stored herein.'

River · A.6.1.1.6.2.6.1.3.1.2:

> The Ethereum Mainnet Instances of River deals with `Active` Status are stored herein.

Maple · A.6.1.1.6.2.6.1.3.1.1:

> The Ethereum Mainnet Instances of the Maple Protocol with `Active` Status are stored herein.

**Action:** kept, severity high.

### 139. A.6.1.1.7.2.1.1.4 In Progress Invocations Directory — real, re-filed

Sweep id `A.6.1.1.7.2.1.1.4#structural` (`ff4e7a8d-3832-40a3-b2b0-fec3831ed689`), factual pass, category `structural`. A.6.1.1.7.2.1.1.4 is titled like hub doc A.6.1.1.7.2.1.1.1.4; parallel A.6.1.1.7.2.1.2.4 is 'In Progress Invocations' (Osero's .1.3 already uses 'Completed Instances'). Title-only defect.

In Progress Invocations Directory · A.6.1.1.7.2.1.1.4:

> In Progress Invocations Directory

In Progress Invocations Directory · A.6.1.1.7.2.1.1.1.4:

> In Progress Invocations Directory

Completed Instances · A.6.1.1.7.2.1.1.3:

> Completed Instances

**Action:** re-filed as `naming`.

### 140. A.6.1.1.7.2.5.1.2.2.2.1 Routine Protocol — false positive

Sweep id `A.6.1.1.7.2.5.1.2.2.2.1#copy-paste` (`1b4d6f03-f4f2-45c0-a4d3-02b842656ea7`), language pass, category `copy-paste`. 'customized to <Agent>' names the Agent, not the Instance, across every Prime. A.6.1.1.1.2.5.1.2.1.2.1 says 'customized to Spark' and all Osero instances say 'Osero', so 'Osero' is correct here.

Routine Protocol · A.6.1.1.7.2.5.1.2.2.2.1:

> In future iterations of the Osero Artifact, a version of the full process definition customized to Osero will be included herein.

Routine Protocol · A.6.1.1.1.2.5.1.2.1.2.1:

> In future iterations of the Spark Artifact, a version of the full process definition customized to Spark will be included herein.

**Action:** rejected.

### 141. A.6.1.1.7.2.6.1.3.1.1.1.2.1.4 Token — false positive (see addendum)

Sweep id `A.6.1.1.7.2.6.1.3.1.1.1.2.1.4#naming` (`be9ca01f-1675-4d83-80af-b80789c3bd6f`), factual pass, category `naming`. Mainnet Token identifier A.6.1.1.7.2.6.1.3.1.1.1.2.1.4 is all-lowercase 'ogusdcp' while the parallel Base Instance A.6.1.1.7.2.6.1.3.2.1.1.2.1.4 writes 'ogUSDCb'; on-chain symbol casing not verifiable from text.

Token · A.6.1.1.7.2.6.1.3.1.1.1.2.1.4:

> ogusdcp

Token · A.6.1.1.7.2.6.1.3.2.1.1.2.1.4:

> ogUSDCb

**Action:** rejected on human review — see the addendum.

### 142. A.6.1.1.8.2.1.1.1.3 Completed Instances — real, re-filed

Sweep id `A.6.1.1.8.2.1.1.1.3#structural` (`9378730b-3ec4-4b75-918d-1dc4163f4c45`), factual pass, category `structural`. Hub doc A.6.1.1.8.2.1.1.1.3 describes itself as a Directory yet is titled 'Completed Instances'; every other agent's hub slot (e.g. A.6.1.1.7.2.1.1.1.3) is 'Completed Instances Directory'.

Completed Instances · A.6.1.1.8.2.1.1.1.3:

> This document contains a Directory of all Instances of the Agent Creation Primitive with Instance status of `Completed`.

Completed Instances Directory · A.6.1.1.7.2.1.1.1.3:

> Completed Instances Directory

**Action:** re-filed as `naming`, severity high.

### 143. A.6.1.1.8.2.1.1.3 Completed Instances Directory — real, re-filed

Sweep id `A.6.1.1.8.2.1.1.3#structural` (`f661d4a1-a5ff-4cbd-8d57-82418669a279`), factual pass, category `structural`. A.6.1.1.8.2.1.1.3 holds the Instances (child is the Single Instance Configuration Document) but is titled 'Completed Instances Directory'; parallel A.6.1.1.8.2.1.2.3 is 'Completed Instances'.

Completed Instances Directory · A.6.1.1.8.2.1.1.3:

> The Instances of the Agent Creation Primitive with `Completed` Status are contained herein.

Completed Instances · A.6.1.1.8.2.1.2.3:

> Completed Instances

**Action:** re-filed as `naming`.

---

## Addendum — rows rejected on human review

### Row 129 — shared Integration Partner Reward Address

The reviewer kept row 129 as real at `low`, reading the shared address as likely copy-paste. On human review it is a false positive: the Morpho (A.6.1.1.4.2.5.2.2.3.1.2) and Curve (A.6.1.1.4.2.5.2.2.2.1.2) Integration Boost Instances name the same Integration Partner Reward Address because one address does receive the rewards for both integrations. Nothing in either Instance requires the address to be unique to one partner, so a shared address is not a defect. The row is moved to `rejected`, so a later sweep cannot re-add it while the quoted text is unchanged.

### Row 141 — Osero Mainnet token symbol `ogusdcp`

The reviewer kept row 141 as real at `low`, reading the all-lowercase Token identifier in A.6.1.1.7.2.6.1.3.1.1.1.2.1.4 as an inconsistency with the Base Instance's `ogUSDCb` (A.6.1.1.7.2.6.1.3.2.1.1.2.1.4). On human review it is a false positive: the Mainnet vault contract (`0x802148d518a6de2af866f9a61ffb5e5c39156db2`) reports its symbol as `ogusdcp` itself, so the Atlas records the token exactly as deployed. The two Instances differ because the deployed tokens differ; the suggested fix `ogUSDCp` would make the Atlas wrong. This is the one verdict in these reviews that rests on on-chain state rather than Atlas text, supplied by the human reviewer. The row is moved to `rejected`; its low-severity twin was already rejected as its duplicate.

### Rows 25 and 27 — `Atlas Edit Proposal` in the offchain-vote Process Flow

Kept, with the issue text reworded. The stored text said `Atlas Edit Proposal` "does not exist in the process", which read as a claim that the term is not an Atlas concept. It is one: Core GovOps publishes an Atlas Edit Proposal for a Sky Governance Poll (A.1.10.2.3.2.1.1.1.4). The defect stands in context: A.2.2.9.1.2.3.5.2 and A.2.2.9.2.2.3.5.2 set up a Prime Agent token-holder Snapshot vote on an Agent Artifact change, their next steps edit the `Artifact Edit Proposal` Document (A.2.2.9.1.2.3.5.3, A.2.2.9.2.2.3.5.3), and no Sky Core Atlas document is updated (A.2.2.9.1.2.3.5.4.1, A.2.2.9.2.2.3.5.4.1). The issue text now says so.

