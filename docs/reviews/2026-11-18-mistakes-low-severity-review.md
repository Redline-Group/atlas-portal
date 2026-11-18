# Low-severity findings review

**Date:** 2026-11-18
**Corpus as reviewed:** `public/potential-mistakes.json` after the 2026-11-18 incremental sweep and that day's earlier reviews ([new contradictions](2026-11-18-mistakes-contradiction-review.md), [contradiction backlog](2026-11-18-mistakes-contradiction-backlog.md), [high severity](2026-11-18-mistakes-high-severity-review.md), [medium severity](2026-11-18-mistakes-medium-severity-review.md)); atlas SHA `6daa01968a0fc3fe67fdedc45761cf33ba114515`. Scope: every `low` row those reviews did not already decide — 55 rows (19 language-pass, 35 factual-pass, 1 mechanical). The other low rows are ones an earlier review lowered.
**Question:** does each defect hold as described, under the right category, at the right confidence?
**Method:** as in the earlier reviews — each row read against the flagged document and whatever siblings, parents or linked documents the claim depends on, at the SHA above. Severity is the sweep's confidence that the defect is real. Every quote below was checked mechanically as a verbatim substring of the document it is attributed to. With this review every finding in the artifact has had a human pass.

---

## Bottom line

**30 real, 2 real but re-filed, 17 false positives, 6 duplicates.** 19 kept rows were raised out of `low`: the low bucket held plainly real slips the sweep was merely unsure about. Most false positives are Atlas conventions the sweep took for errors — shared rate limits, identical token and pool addresses for a self-tokenised pool, chain-suffixed limit keys, a defined role name read as a typo.

Review calls on top of the reviewers' verdicts:

- **Six pairs (rows 3/4, 7/8, 17/18, 19/20, 26/27, 30/31).** In each, the language and factual passes reported one defect on one document — A.1.11.2.5.2, A.2.2.9.2.2.3.1.4.2, A.2.8.2.2.2.7.2.1, A.2.8.2.7.2.2.2.2, A.6.1.1.1.2.6.1.1.2.1.9.1 and A.6.1.1.1.2.6.1.1.3.2.1.1. The first row of each pair is kept at the higher of the two severities; the second is rejected as its duplicate.
- **Row 53 (A.6.1.1.3.2.2.2.2.1.2.1.5) is overridden to false positive.** It is the same Root Edit template text as rows 25 (A.6.1.1.1.2.2.2.2.1.2.1.4) and 43 (A.6.1.1.2.2.2.2.2.1.2.1.5), which their reviewers rejected: the link text is the URL itself and the pulls page is where Atlas updates are made. Three Primes' copies of one template get one verdict.

| # | Finding | Category | Verdict | Action | Reason |
|---|---|---|---|---|---|
| 1 | A.1.5.5.0.4.2 Other Ecosystem Roles - Phrase Must Be Read In Its Broadest Sense By Facilitators | xref | Real, re-filed | re-filed as `typo`, fix corrected | Link resolves by UUID; the mismatch comes from the target title A.1.5.5.0.4.1 mixing a curly opening quote with a straight closing quote around "Operationally Active". |
| 2 | A.1.10.2.3.2.1.2.1.2.1 Requirements For Forum Post | grammar | Real | kept | In A.1.10.2.3.2.1.2.1.2.1 the list after 'The Forum post must include the following:' has a full-clause item that does not name something the post includes; the fix restores parallelism. |
| 3 | A.1.11.2.5.2 Simultaneous Edit Reconciliation Process Definition | naming | Real | kept, severity medium | A.1.11.2.5.2 says "Atlas Edit Weekly Cycle Proposals" everywhere else in the same document; this one sentence drops "Cycle". |
| 4 | A.1.11.2.5.2 Simultaneous Edit Reconciliation Process Definition | naming | Duplicate | rejected (duplicate of row 3) | A.1.11.2.5.2 uses 'Atlas Edit Weekly Cycle Proposals' throughout but drops 'Cycle' in one sentence; the fix is correct and minimal. |
| 5 | A.2.2.8.1.1.1.2 Token SkyLink Setup Codification and Validation | grammar | Real | kept, severity medium | In A.2.2.8.1.1.1.2, "to setup an Instance" uses the noun form where the verb phrase "set up" is needed. |
| 6 | A.2.2.9.1.2.3.4.4.2 Agent Artifact Updates | copy-paste | False positive | rejected | 'The Process' is the Operational Facilitator Review process (A.2.2.9.1.2.3.4), which its inputs do complete; triggering the next process is standard boilerplate used across every sibling Agent Artifact Updates doc. |
| 7 | A.2.2.9.2.2.3.1.4.2 Agent Artifact Updates | naming | Real | kept | A.2.2.9.2.2.3.1.4.2 names the field "In Progress Invocations Directory" in the first bullet and drops "Directory" in the second. The shorter form is also repeated in A.2.2.9.2.2.3.2.1.1.2 and A.2.2.9.1.2.3.1.4.2. |
| 8 | A.2.2.9.2.2.3.1.4.2 Agent Artifact Updates | naming | Duplicate | rejected (duplicate of row 7) | A.2.2.9.2.2.3.1.4.2 names the same Hub section 'In Progress Invocations Directory' in stage one and 'In Progress Invocations' in stage two; the fix is correct. |
| 9 | A.2.2.9.2.2.3.2.4.2.1 Primitive Hub Document Update | entity | Real | kept, severity medium, fix corrected | Mid-invocation, A.2.2.9.2.2.3.2.4.2.1 targets Active instances/Instance status, while the prior stage (A.2.2.9.2.2.3.1.4.2) and the Distribution Reward twin (A.2.2.9.1.2.3.2.4.2.1) use In Progress Invocations/Invocation Status. |
| 10 | A.2.2.9.2.2.3.4.4.2 Agent Artifact Updates | copy-paste | False positive | rejected | 'The Process' here is the Operational Facilitator Review process (A.2.2.9.2.2.3.4), which its inputs complete; the same boilerplate sentence appears in every sibling Agent Artifact Updates doc. |
| 11 | A.2.2.10.1.1.1.2.3.1.2.20.1 Highest Production Rate Limit For Uniswap v3 Facet | numeric | False positive | rejected | Per A.2.2.10.1.1.1.2.3.1.2 these are historical highs of maxAmount and slope, recorded separately; a slope above maxAmount is a valid fast refill, and nothing in the text shows the figure is wrong. |
| 12 | A.2.2.10.1.1.1.3.2.3.2 Eligible Collateral Oracle Methodologies | entity | Real | kept | A.2.2.10.1.1.1.3.2.2 lists stETH as collateral, yet A.2.2.10.1.1.1.3.2.3.2 prices it with the wstETH-to-ETH rate, unlike the X-to-ETH pattern used for weETH and sUSDS; the asset or the rate is misnamed. |
| 13 | A.2.2.10.1.1.2.2.3 Official Update of Artifact | entity | False positive | rejected | 'Operational Executor Facilitator' is a defined Atlas term (A.0.1.1.50, A.1.7.1) and is used the same way in sibling steps A.2.2.10.1.1.2.2.1-2 and A.2.2.8.1.1.1.2.3. |
| 14 | A.2.2.10.1.1.3.2.1.2.2 Minimum Capabilities of Prime TRC Management Systems | grammar | Real | kept, severity medium | "RRC" is read letter by letter ("are-are-see"), so A.2.2.10.1.1.3.2.1.2.2 needs "an RRC-incident", not "a RRC-incident". |
| 15 | A.2.2.10.1.1.3.2.1.2.3.2 TRC Report Contents | structural | Real | kept | In A.2.2.10.1.1.3.2.1.2.3.2 'Key Ratio Inputs...' sits under 'For each category of TRC held' beside IJRC/PEJRC/TEJRC/OSRC, but it covers figures computed from those categories, not a category itself. |
| 16 | A.2.3.1.4 Implementation | grammar | False positive | rejected | A.2.3.1.4 is grammatical: changes to the documents define the intended operation, while on-chain effect needs an Executive Vote. That contrast is deliberate. |
| 17 | A.2.8.2.2.2.7.2.1 Transfer Of Genesis Capital Allocation To Spark SubProxy | naming | Real | kept | A.2.8.2.2.2.7.2.1 calls the budget "Sky Ecosystem Liquidity Bootstrapping Budget" and then "Ecosystem Liquidity Bootstrapping Budget". A.2.8.2.2.2.7.4.2, which it cites, uses the full name for the same 2.4M transfer. |
| 18 | A.2.8.2.2.2.7.2.1 Transfer Of Genesis Capital Allocation To Spark SubProxy | naming | Duplicate | rejected (duplicate of row 17) | A.2.8.2.2.2.7.2.1 calls the budget 'Sky Ecosystem Liquidity Bootstrapping Budget' and then 'Ecosystem Liquidity Bootstrapping Budget' in the same sentence; A.2.8.2.2.2.7.4.2 uses the full name. The fix is correct. |
| 19 | A.2.8.2.7.2.2.2.2 Transfer Of Genesis Capital Allocation To USDS Demand Multisig | naming | Real | kept, severity medium, fix corrected | The A.2.8.2.7.2.2.2.2 title says "USDS Demand Multisig", but its body and the linked A.6.1.1.4.3.4.2 call it "USDS Demand Subsidies Multisig". |
| 20 | A.2.8.2.7.2.2.2.2 Transfer Of Genesis Capital Allocation To USDS Demand Multisig | naming | Duplicate | rejected (duplicate of row 19) | The title of A.2.8.2.7.2.2.2.2 says 'USDS Demand Multisig', but its body and the linked A.6.1.1.4.3.4.2 say 'USDS Demand Subsidies Multisig'; the fix is correct. |
| 21 | A.2.8.2.7.2.2.3.2 Skybase Foundation Grant Authorization: November 2026 | entity | False positive | rejected | The November grant is explicitly for the November Executive Vote, and a Sky Core Spell can execute SubProxy actions (A.1.10.2.3.2.3.2.1, A.4.6.2.1.3); a different vehicle from the July grant is not an error. |
| 22 | A.2.11.1.3.2.2.1.2.3 Standard Incident Reporting Process | governance | Real | kept, severity medium | The 48-hour follow-up step in A.2.11.1.3.2.2.1.2.3 names no responsible party, while the parallel emergency process A.2.11.1.3.2.2.1.2.2 assigns it to the Multisig Administrator via the reporting signer. |
| 23 | A.3.5.2.2.1.2.1 Kicker Lot Size Current Value | markdown | Real | kept, severity medium | A.3.5.2.2.1.2.1 leaves kbump unformatted, while its sibling documents A.3.5.2.1.1.1.1, A.3.5.2.1.1.2.1 and A.3.5.2.2.1.1.1 backtick `hop`, `burn` and `khump`. |
| 24 | A.4.4.1.3.8.5.3.5.1 Non-Disclosure Of The Interest Rate Model | entity | False positive | rejected | A.4.4.1.3.8.5.3.5.1 has the specifier review Sidestream's implementation, which is a coherent workflow; no Atlas rule requires an independent reviewer, so the claim is speculation. |
| 25 | A.6.1.1.1.2.2.2.2.1.2.1.4 Root Edit Artifact Update | xref | False positive | rejected | The link text is the URL itself, so label and target agree. The pulls page is part of the repository and is where Atlas updates are made. The same template text appears in every Prime artifact (e.g. A.6.1.1.2.2.2.2.2.1.2.1.5). |
| 26 | A.6.1.1.1.2.6.1.1.2.1.9.1 Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location | naming | Real | kept, severity medium, fix corrected | A.6.1.1.1.2.6.1.1.2.1.9.1 names the instance "Binance Transfer USDC to Binance (receive USDT)", but the ICD it links (A.6.1.1.1.2.6.1.3.1.9.1) names it "Transfer USDC to Binance (receive USDT)". |
| 27 | A.6.1.1.1.2.6.1.1.2.1.9.1 Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location | naming | Duplicate | rejected (duplicate of row 26) | The Location title adds a stray 'Binance' that the linked ICD title (A.6.1.1.1.2.6.1.3.1.9.1) does not have. Sibling Location titles (e.g. A.6.1.1.1.2.6.1.1.2.1.10.1) mirror their ICD title, and sibling 9.2 has the same defect. |
| 28 | A.6.1.1.1.2.6.1.1.2.1.9.2 Ethereum Mainnet - Binance Transfer USDT to Binance (receive USDC) Instance Configuration Document Location | naming | Real | kept, severity medium, fix corrected | A.6.1.1.1.2.6.1.1.2.1.9.2 names the instance "Binance Transfer USDT to Binance (receive USDC)", but the ICD it links (A.6.1.1.1.2.6.1.3.1.9.2) names it "Transfer USDT to Binance (receive USDC)". |
| 29 | A.6.1.1.1.2.6.1.1.2.3.1 Spark Savings V2 | naming | False positive | rejected | Every Spark Savings directory heading (e.g. A.6.1.1.1.2.6.1.1.2.1.4, A.6.1.1.1.2.6.1.3.1.4) writes "V2", so this is a consistent Title Case heading convention, not a one-off slip. |
| 30 | A.6.1.1.1.2.6.1.1.3.2.1.1 Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document Location | naming | Real | kept, fix corrected | The two titles do disagree. The odd one out is the linked ICD A.6.1.1.1.2.6.1.4.2.1.1 ("Base Mainnet"): every other Base heading, e.g. A.6.1.1.1.2.6.1.4.2.2.1, says "Base -". |
| 31 | A.6.1.1.1.2.6.1.1.3.2.1.1 Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document Location | xref | Duplicate | rejected (duplicate of row 30) | The link label correctly matches its target's title, so the xref holds. The real inconsistency is that ICD A.6.1.1.1.2.6.1.4.2.1.1 says 'Base Mainnet', while its Location doc and the Base Aave ICD A.6.1.1.1.2.6.1.4.2.2.1 say 'Base'. |
| 32 | A.6.1.1.1.2.6.1.1.3.4.2 Spark Savings V2 | grammar | Real | kept | A.6.1.1.1.2.6.1.1.3.4.2 has no closing period, while its sibling A.6.1.1.1.2.6.1.1.3.4.1 ends with one. |
| 33 | A.6.1.1.1.2.6.1.2.1.1.3.6.3.1 Maximum USDC Bridged From Ethereum Mainnet To Avalanche Via Circle CCTP | entity | False positive | rejected | Spark labels its per-destination CCTP limits with a chain suffix throughout (`LIMIT_USDC_TO_CCTP_BASE` in A.6.1.1.1.2.6.1.2.1.1.3.2.7.1, `_ETH` in .3.1.4.1), so `_AVALANCHE` follows house style and is not a misnaming. |
| 34 | A.6.1.1.1.2.6.1.3.1.5.1.2.2.3 Pool Address | entity | False positive | rejected | A pool whose share token is the pool contract itself has the same Token and Pool Address; the Curve ICD (A.6.1.1.1.2.6.1.3.1.2.1.2.2.1/.4) shows the same identical pairing. |
| 35 | A.6.1.1.1.2.6.1.3.1.9.2.2.3.1 OTC Swap Rate Limit ID | entity | False positive | rejected | The two Binance ICDs state that their OTC swap rate limit is shared with each other (A.6.1.1.1.2.6.1.3.1.9.2.2.4.1 and 9.1.2.4.1), so an identical RateLimitID is intended. |
| 36 | A.6.1.1.1.2.6.1.3.2.1.1.3 Instance-specific Operational Processes | grammar | Real | kept, severity medium, fix corrected | A.6.1.1.1.2.6.1.3.2.1.1.3 runs "procedures see [" together. Sibling ICDs (e.g. A.6.1.1.1.2.6.1.4.2.1.1.3) write "procedures specified in [...] and, for emergency procedures, [...]". |
| 37 | A.6.1.1.1.2.6.1.3.5.1.2.4.2.2 Rate Limits | grammar | Real | kept | In A.6.1.1.1.2.6.1.3.5.1.2.4.2.2, the singular subject `maxAmount` takes the plural "are defined". The same wording is repeated in the sibling Rate Limits documents. |
| 38 | A.6.1.1.1.2.6.1.4.1.4.1.3.3 Remove A Delegated Signer In The Ethena Minter Contract | naming | Real | kept, severity medium | The A.6.1.1.1.2.6.1.4.1.4.1.3.3 title says "Ethena Minter", but its body and its siblings .3.2 and .3.5 use the contract name "EthenaMinter". |
| 39 | A.6.1.1.1.2.6.1.4.1.4.1.3.4 Approve Minting of USDe By Ethena Minter Contract | naming | Real | kept, severity medium | The A.6.1.1.1.2.6.1.4.1.4.1.3.4 title says "Ethena Minter", but its body and its sibling .3.5 ("By EthenaMinter Contract") use "EthenaMinter". |
| 40 | A.6.1.1.1.2.6.1.4.1.4.2.3 Instance-specific Operational Processes | grammar | Real | kept, severity medium | A.6.1.1.1.2.6.1.4.1.4.2.3 writes "specific for this instance"; the standard collocation is "specific to". |
| 41 | A.6.1.1.1.3.5.3.2.3.9 Spark Savings USDC on X Layer | xref | Real | kept, severity medium | The link label calls A.6.1.1.1.3.5.2.2.9 'Onchain Parameters', but that doc is titled 'Spark Savings USDC on X Layer'. The same label recurs in siblings 3.2.3.2 and 3.2.3.6-3.2.3.8. |
| 42 | A.6.1.1.1.3.9.7.2.4 Sentora RLUSD Morpho Vault - Ethereum Mainnet | entity | False positive | rejected | No Atlas rule bars one multisig from holding both the Sentinel and Allocator roles. A.6.1.1.1.3.9.7.2.4 lists both deliberately, and the finding only asks for confirmation. |
| 43 | A.6.1.1.2.2.2.2.2.1.2.1.5 Root Edit Artifact Update | xref | False positive | rejected | This is the same template text as A.6.1.1.1.2.2.2.2.1.2.1.4. The link text is the URL itself, and the pulls page is part of the repository and is where Atlas updates are made. |
| 44 | A.6.1.1.2.2.6.1.2.2.1.1.1.1 Default Admin Role | markdown | Real, re-filed | re-filed as `typo`, severity medium | The constructor in A.6.1.1.2.2.6.1.2.2.1.1.1.1 is missing its closing brace before the fence. The equivalent blocks (e.g. A.6.1.1.3.2.6.1.2.2.1.1.1.1) close it. It is truncated code, not a markdown fault. |
| 45 | A.6.1.1.2.2.6.1.3.1.4.3.2.4.1 Deposit Rate Limit (via FalconX) | numeric | Real | kept, severity medium | Slope is a rate but has no time unit; the FalconX docs (A.6.1.1.2.2.6.1.3.1.4.3/.4.2.4.x) are the only Grove rate limits without 'per day', e.g. A.6.1.1.2.2.6.1.3.1.4.1.2.4.1. |
| 46 | A.6.1.1.2.2.6.1.3.1.4.3.2.4.2 Withdrawal Rate Limit (via FalconX) | numeric | Real | kept, severity medium | Slope lacks a time unit, unlike other Grove rate limits such as A.6.1.1.2.2.6.1.3.1.4.1.2.4.2 which state 'per day'. |
| 47 | A.6.1.1.2.2.6.1.3.1.4.4.2.4.1 Deposit Rate Limit (via FalconX) | numeric | Real | kept, severity medium | Slope lacks a time unit, unlike other Grove rate limits such as A.6.1.1.2.2.6.1.3.1.4.1.2.4.1 which state 'per day'. |
| 48 | A.6.1.1.2.2.6.1.3.1.4.4.2.4.2 Withdrawal Rate Limit (via FalconX) | numeric | Real | kept, severity medium | Slope lacks a time unit, unlike other Grove rate limits such as A.6.1.1.2.2.6.1.3.1.4.1.2.4.2 which state 'per day'. |
| 49 | A.6.1.1.2.2.6.1.3.1.7.5.2.2.6 Allocator Role Addresses | entity | Real | kept, fix corrected | All four sibling Grove x Steakhouse vaults (e.g. A.6.1.1.2.2.6.1.3.1.7.4.2.2.6) list a sixth allocator 0xfeed46…3C9a after the same five rows; the PYUSD table omits it, likely a dropped row. |
| 50 | A.6.1.1.2.2.6.1.3.1.11.1.2.3 Rate Limit IDs | structural | False positive | rejected | A.6.1.1.2.2.6.1.3.1.11.1.2.3 has Inflow, Outflow, Mint and Redeem RateLimitID children, and sibling Rate Limits .4 has Deposit, Withdrawal, Mint and Redeem limits; all four operations are covered. |
| 51 | A.6.1.1.2.2.6.1.3.1.11.1.2.4 Rate Limits | structural | False positive | rejected | A.6.1.1.2.2.6.1.3.1.11.1.2.4 has four children: Deposit, Withdrawal, Mint (.4.3) and Redeem (.4.4) Rate Limits, matching the four operations named. |
| 52 | A.6.1.1.2.3.7.1.4 Execution Agent | governance | Real | kept | A.6.1.1.2.3.7.1.4 has the Purchase Executor (Grove Foundation) naming the agent in Parameters, but A.6.1.1.2.3.7 says plan changes go through the Root Edit Primitive, which the Executor does not run. |
| 53 | A.6.1.1.3.2.2.2.2.1.2.1.5 Root Edit Artifact Update | xref | False positive | rejected (review override) | Text says 'repository located at' but links the /pulls list; the same template wording recurs in every Prime's Root Edit Artifact Update (e.g. A.6.1.1.2.2.2.2.2.1.2.1.5). |
| 54 | A.6.1.1.5.2.6.1.3.1.1.1.2.4.1 Inflow Rate Limit | naming | Real | kept | Title 'Inflow Rate Limit' but the body says 'deposit rate limit parameters' and the paired sibling A.6.1.1.5.2.6.1.3.1.1.1.2.4.2 is 'Withdrawal Rate Limit'; the pair mixes terms. |
| 55 | A.6.1.1.6.2.6.1.3.1.1.1.2.4.1 Inflow Rate Limit | naming | Real | kept | Title 'Inflow Rate Limit' but the body says 'deposit rate limit parameters' and the paired sibling A.6.1.1.6.2.6.1.3.1.1.1.2.4.2 is 'Withdrawal Rate Limit'; the pair mixes terms. |

---

## Rejected, re-filed or changed — evidence

### 1. A.1.5.5.0.4.2 Other Ecosystem Roles - Phrase Must Be Read In Its Broadest Sense By Facilitators — real, re-filed

Sweep id `A.1.5.5.0.4.2#xref` (`56fd4055-b412-4058-a33a-57d4d1b54181`), deterministic pass, category `xref`. Link resolves by UUID; the mismatch comes from the target title A.1.5.5.0.4.1 mixing a curly opening quote with a straight closing quote around "Operationally Active".

Operationally Active - Whether An Entity Is “Operationally Active" In A Role Is Determined Purely On A Formal Basis · A.1.5.5.0.4.1:

> Whether An Entity Is “Operationally Active" In A Role

Other Ecosystem Roles - Phrase Must Be Read In Its Broadest Sense By Facilitators · A.1.5.5.0.4.2:

> Whether An Entity Is "Operationally Active" In A Role

Corrected fix: `In the A.1.5.5.0.4.1 title, replace “Operationally Active" with "Operationally Active"`

**Action:** re-filed as `typo`, fix corrected.

### 3. A.1.11.2.5.2 Simultaneous Edit Reconciliation Process Definition — real

Sweep id `A.1.11.2.5.2#naming` (`edb3b979-b7b6-4728-9c26-cf768d8827ea`), language pass, category `naming`. A.1.11.2.5.2 says "Atlas Edit Weekly Cycle Proposals" everywhere else in the same document; this one sentence drops "Cycle".

Simultaneous Edit Reconciliation Process Definition · A.1.11.2.5.2:

> If there are two conflicting Atlas Edit Weekly Proposals

Simultaneous Edit Reconciliation Process Definition · A.1.11.2.5.2:

> more than two conflicting Atlas Edit Weekly Cycle Proposals

**Action:** kept, severity medium.

### 4. A.1.11.2.5.2 Simultaneous Edit Reconciliation Process Definition — duplicate

Sweep id `A.1.11.2.5.2#naming-2` (`edb3b979-b7b6-4728-9c26-cf768d8827ea`), factual pass, category `naming`. A.1.11.2.5.2 uses 'Atlas Edit Weekly Cycle Proposals' throughout but drops 'Cycle' in one sentence; the fix is correct and minimal.

Simultaneous Edit Reconciliation Process Definition · A.1.11.2.5.2:

> If there are two conflicting Atlas Edit Weekly Proposals

Simultaneous Edit Reconciliation Process Definition · A.1.11.2.5.2:

> In the event there are more than two conflicting Atlas Edit Weekly Cycle Proposals

**Action:** rejected (duplicate of row 3).

### 5. A.2.2.8.1.1.1.2 Token SkyLink Setup Codification and Validation — real

Sweep id `A.2.2.8.1.1.1.2#grammar` (`18ce8e21-898d-4bf9-9bf8-ef1c1e7266ee`), language pass, category `grammar`. In A.2.2.8.1.1.1.2, "to setup an Instance" uses the noun form where the verb phrase "set up" is needed.

Token SkyLink Setup Codification and Validation · A.2.2.8.1.1.1.2:

> how agreements to setup an Instance

**Action:** kept, severity medium.

### 6. A.2.2.9.1.2.3.4.4.2 Agent Artifact Updates — false positive

Sweep id `A.2.2.9.1.2.3.4.4.2#copy-paste` (`9cb3ab72-37f5-4501-8661-a204d0747dd8`), factual pass, category `copy-paste`. 'The Process' is the Operational Facilitator Review process (A.2.2.9.1.2.3.4), which its inputs do complete; triggering the next process is standard boilerplate used across every sibling Agent Artifact Updates doc.

Agent Artifact Updates · A.2.2.9.1.2.3.4.4.2:

> No Agent Artifact documents are updated as the output of this process.

Process Definition For Operational Facilitator Review · A.2.2.9.1.2.3.4:

> The documents herein define the process for Operational Facilitator Review for an Invocation of the Distribution Reward Primitive.

**Action:** rejected.

### 8. A.2.2.9.2.2.3.1.4.2 Agent Artifact Updates — duplicate

Sweep id `A.2.2.9.2.2.3.1.4.2#naming-2` (`d86e5f9f-7b1c-4605-9253-4281a6bdbc13`), factual pass, category `naming`. A.2.2.9.2.2.3.1.4.2 names the same Hub section 'In Progress Invocations Directory' in stage one and 'In Progress Invocations' in stage two; the fix is correct.

Agent Artifact Updates · A.2.2.9.2.2.3.1.4.2:

> Edit `Primitive Hub Document/In Progress Invocations Directory/Instance Name`

Agent Artifact Updates · A.2.2.9.2.2.3.1.4.2:

> Edit `Primitive Hub Document/In Progress Invocations/Instance Name`

**Action:** rejected (duplicate of row 7).

### 9. A.2.2.9.2.2.3.2.4.2.1 Primitive Hub Document Update — real

Sweep id `A.2.2.9.2.2.3.2.4.2.1#entity` (`09ddd2c5-3768-4538-b979-629e1b369299`), factual pass, category `entity`. Mid-invocation, A.2.2.9.2.2.3.2.4.2.1 targets Active instances/Instance status, while the prior stage (A.2.2.9.2.2.3.1.4.2) and the Distribution Reward twin (A.2.2.9.1.2.3.2.4.2.1) use In Progress Invocations/Invocation Status.

Primitive Hub Document Update · A.2.2.9.2.2.3.2.4.2.1:

> Active instances/Instance name/Instance status -

Agent Artifact Updates · A.2.2.9.2.2.3.1.4.2:

> Edit `Primitive Hub Document/In Progress Invocations Directory/Instance Name`

Primitive Hub Document/In Progress Invocations Directory/Instance Name Update · A.2.2.9.1.2.3.2.4.2.1:

> Primitive Hub Document/In Progress Invocations Directory/Instance Name Update

Corrected fix: `Replace 'Active instances/Instance name/Instance status -' with 'In Progress Invocations Directory/Instance Name/Invocation Status'`

**Action:** kept, severity medium, fix corrected.

### 10. A.2.2.9.2.2.3.4.4.2 Agent Artifact Updates — false positive

Sweep id `A.2.2.9.2.2.3.4.4.2#copy-paste` (`d5cce836-259e-48df-ba77-89d58d1476cc`), factual pass, category `copy-paste`. 'The Process' here is the Operational Facilitator Review process (A.2.2.9.2.2.3.4), which its inputs complete; the same boilerplate sentence appears in every sibling Agent Artifact Updates doc.

Agent Artifact Updates · A.2.2.9.2.2.3.4.4.2:

> No Agent Artifact documents are updated as the output of this process.

Process Definition for Operational Facilitator Review · A.2.2.9.2.2.3.4:

> The documents herein define the process for Operational Facilitator Review for an Invocation of the Integration Boost Primitive.

**Action:** rejected.

### 11. A.2.2.10.1.1.1.2.3.1.2.20.1 Highest Production Rate Limit For Uniswap v3 Facet — false positive

Sweep id `A.2.2.10.1.1.1.2.3.1.2.20.1#numeric` (`d9b04eda-c204-4bac-a2ec-7af1f9d0dd9c`), factual pass, category `numeric`. Per A.2.2.10.1.1.1.2.3.1.2 these are historical highs of maxAmount and slope, recorded separately; a slope above maxAmount is a valid fast refill, and nothing in the text shows the figure is wrong.

Facets · A.2.2.10.1.1.1.2.3.1.2:

> the highest `maxAmount` and `slope` any Diamond PAU Instance has operated at in production for that Facet

Highest Production Rate Limit For Uniswap v3 Facet · A.2.2.10.1.1.1.2.3.1.2.20.1:

> `slope`: 25,000,000 of the token sold per day

**Action:** rejected.

### 13. A.2.2.10.1.1.2.2.3 Official Update of Artifact — false positive

Sweep id `A.2.2.10.1.1.2.2.3#entity` (`2b1612b8-480c-49b3-a304-6a6f593340de`), factual pass, category `entity`. 'Operational Executor Facilitator' is a defined Atlas term (A.0.1.1.50, A.1.7.1) and is used the same way in sibling steps A.2.2.10.1.1.2.2.1-2 and A.2.2.8.1.1.1.2.3.

Operational Executor Facilitator · A.0.1.1.50:

> Operational Executor Facilitators are Facilitators that interpret Artifacts and the Atlas on behalf of Operational Executor Agents.

Validation And Off-Chain Vote · A.2.2.10.1.1.2.2.2:

> The Operational Executor Facilitator reviews the proposal to ensure that it is complete and aligned with the Atlas.

**Action:** rejected.

### 14. A.2.2.10.1.1.3.2.1.2.2 Minimum Capabilities of Prime TRC Management Systems — real

Sweep id `A.2.2.10.1.1.3.2.1.2.2#grammar` (`d034533f-9b6f-411c-8b60-3bccb374765f`), language pass, category `grammar`. "RRC" is read letter by letter ("are-are-see"), so A.2.2.10.1.1.3.2.1.2.2 needs "an RRC-incident", not "a RRC-incident".

Minimum Capabilities of Prime TRC Management Systems · A.2.2.10.1.1.3.2.1.2.2:

> should define a RRC-incident

**Action:** kept, severity medium.

### 16. A.2.3.1.4 Implementation — false positive

Sweep id `A.2.3.1.4#grammar` (`f67a5780-11d5-4014-8254-795080c77133`), language pass, category `grammar`. A.2.3.1.4 is grammatical: changes to the documents define the intended operation, while on-chain effect needs an Executive Vote. That contrast is deliberate.

Implementation · A.2.3.1.4:

> Changes to the documents herein define the intended operation of the Sky Treasury Management Function; operational effect on the Sky Protocol requires a subsequent Executive Vote.

**Action:** rejected.

### 18. A.2.8.2.2.2.7.2.1 Transfer Of Genesis Capital Allocation To Spark SubProxy — duplicate

Sweep id `A.2.8.2.2.2.7.2.1#naming-2` (`e3ec99ec-54c9-4fe7-8104-aee20c57ec57`), factual pass, category `naming`. A.2.8.2.2.2.7.2.1 calls the budget 'Sky Ecosystem Liquidity Bootstrapping Budget' and then 'Ecosystem Liquidity Bootstrapping Budget' in the same sentence; A.2.8.2.2.2.7.4.2 uses the full name. The fix is correct.

Transfer Of Genesis Capital Allocation To Spark SubProxy · A.2.8.2.2.2.7.2.1:

> 2.4 million USDS transferred from the Ecosystem Liquidity Bootstrapping Budget

Transfer From Liquidity Bootstrapping Budget To Spark For Exchanges · A.2.8.2.2.2.7.4.2:

> Sky has transferred 2.4 million USDS from the Sky Ecosystem Liquidity Bootstrapping Budget to Spark

**Action:** rejected (duplicate of row 17).

### 19. A.2.8.2.7.2.2.2.2 Transfer Of Genesis Capital Allocation To USDS Demand Multisig — real

Sweep id `A.2.8.2.7.2.2.2.2#naming` (`be600bf6-c0f2-42c5-ad5c-fd0cb429b628`), language pass, category `naming`. The A.2.8.2.7.2.2.2.2 title says "USDS Demand Multisig", but its body and the linked A.6.1.1.4.3.4.2 call it "USDS Demand Subsidies Multisig".

Transfer Of Genesis Capital Allocation To USDS Demand Multisig · A.2.8.2.7.2.2.2.2:

> Transfer Of Genesis Capital Allocation To USDS Demand Multisig

Transfer Of Genesis Capital Allocation To USDS Demand Multisig · A.2.8.2.7.2.2.2.2:

> USDS Demand Subsidies Multisig (see [A.6.1.1.4.3.4.2 - USDS Demand Subsidies Multisig]

Corrected fix: `Retitle A.2.8.2.7.2.2.2.2 as: Transfer Of Genesis Capital Allocation To USDS Demand Subsidies Multisig`

**Action:** kept, severity medium, fix corrected.

### 20. A.2.8.2.7.2.2.2.2 Transfer Of Genesis Capital Allocation To USDS Demand Multisig — duplicate

Sweep id `A.2.8.2.7.2.2.2.2#naming-2` (`be600bf6-c0f2-42c5-ad5c-fd0cb429b628`), factual pass, category `naming`. The title of A.2.8.2.7.2.2.2.2 says 'USDS Demand Multisig', but its body and the linked A.6.1.1.4.3.4.2 say 'USDS Demand Subsidies Multisig'; the fix is correct.

Transfer Of Genesis Capital Allocation To USDS Demand Multisig · A.2.8.2.7.2.2.2.2:

> Transfer Of Genesis Capital Allocation To USDS Demand Multisig

Transfer Of Genesis Capital Allocation To USDS Demand Multisig · A.2.8.2.7.2.2.2.2:

> from the Surplus Buffer to the USDS Demand Subsidies Multisig

**Action:** rejected (duplicate of row 19).

### 21. A.2.8.2.7.2.2.3.2 Skybase Foundation Grant Authorization: November 2026 — false positive

Sweep id `A.2.8.2.7.2.2.3.2#entity` (`6567f1e3-7c28-44ee-b46c-723f958b1817`), factual pass, category `entity`. The November grant is explicitly for the November Executive Vote, and a Sky Core Spell can execute SubProxy actions (A.1.10.2.3.2.3.2.1, A.4.6.2.1.3); a different vehicle from the July grant is not an error.

Skybase Foundation Grant Authorization: November 2026 · A.2.8.2.7.2.2.3.2:

> for inclusion in the November 2026 Executive Vote

Sky Core Spell Executes Agent Spell · A.1.10.2.3.2.3.2.1:

> Sky Core Spell, which directly calls `exec()` on the Agent's SubProxy contract

Skybase Foundation Grant Authorization: July 2026 · A.2.8.2.7.2.2.3.1:

> in a Skybase Spell included in a Sky Executive Vote unless otherwise agreed by Sky and Skybase

**Action:** rejected.

### 22. A.2.11.1.3.2.2.1.2.3 Standard Incident Reporting Process — real

Sweep id `A.2.11.1.3.2.2.1.2.3#governance` (`ec4cd423-74ba-4e74-82d9-46ba5f6cf526`), factual pass, category `governance`. The 48-hour follow-up step in A.2.11.1.3.2.2.1.2.3 names no responsible party, while the parallel emergency process A.2.11.1.3.2.2.1.2.2 assigns it to the Multisig Administrator via the reporting signer.

Standard Incident Reporting Process · A.2.11.1.3.2.2.1.2.3:

> - Follow-up with the Protocol Security Workstream Lead if no acknowledgment is received within 48 hours.

Emergency Incident Reporting Process · A.2.11.1.3.2.2.1.2.2:

> The Multisig Administrator must ensure that the reporting signer follows up with the Protocol Security Workstream Lead if no acknowledgment is received within 24 hours.

**Action:** kept, severity medium.

### 23. A.3.5.2.2.1.2.1 Kicker Lot Size Current Value — real

Sweep id `A.3.5.2.2.1.2.1#markdown` (`443e0ae4-11d6-43f9-9988-f0e73926bf60`), language pass, category `markdown`. A.3.5.2.2.1.2.1 leaves kbump unformatted, while its sibling documents A.3.5.2.1.1.1.1, A.3.5.2.1.1.2.1 and A.3.5.2.2.1.1.1 backtick `hop`, `burn` and `khump`.

Kicker Lot Size Current Value · A.3.5.2.2.1.2.1:

> The current value of the kbump parameter

Kicker Threshold Current Value · A.3.5.2.2.1.1.1:

> The current value of the `khump` parameter

**Action:** kept, severity medium.

### 24. A.4.4.1.3.8.5.3.5.1 Non-Disclosure Of The Interest Rate Model — false positive

Sweep id `A.4.4.1.3.8.5.3.5.1#entity` (`6c74b4fe-db22-46a4-b8d3-1ce48b9ce7ae`), factual pass, category `entity`. A.4.4.1.3.8.5.3.5.1 has the specifier review Sidestream's implementation, which is a coherent workflow; no Atlas rule requires an independent reviewer, so the claim is speculation.

Non-Disclosure Of The Interest Rate Model · A.4.4.1.3.8.5.3.5.1:

> The algorithm was specified by the Core Council Risk Advisor, implemented and tested by Ecosystem Actor Sidestream, and reviewed by the Core Council Risk Advisor.

**Action:** rejected.

### 25. A.6.1.1.1.2.2.2.2.1.2.1.4 Root Edit Artifact Update — false positive

Sweep id `A.6.1.1.1.2.2.2.2.1.2.1.4#xref` (`a9cecbeb-6f07-46fa-b5ad-68dd8ae4b0f0`), factual pass, category `xref`. The link text is the URL itself, so label and target agree. The pulls page is part of the repository and is where Atlas updates are made. The same template text appears in every Prime artifact (e.g. A.6.1.1.2.2.2.2.2.1.2.1.5).

Root Edit Artifact Update · A.6.1.1.1.2.2.2.2.1.2.1.4:

> update the Atlas GitHub repository located at [https://github.com/sky-ecosystem/next-gen-atlas/pulls](https://github.com/sky-ecosystem/next-gen-atlas/pulls) to reflect the approved proposal

**Action:** rejected.

### 26. A.6.1.1.1.2.6.1.1.2.1.9.1 Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location — real

Sweep id `A.6.1.1.1.2.6.1.1.2.1.9.1#naming` (`fddc6d87-9d31-4234-995d-08fac2f23ef9`), language pass, category `naming`. A.6.1.1.1.2.6.1.1.2.1.9.1 names the instance "Binance Transfer USDC to Binance (receive USDT)", but the ICD it links (A.6.1.1.1.2.6.1.3.1.9.1) names it "Transfer USDC to Binance (receive USDT)".

Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location · A.6.1.1.1.2.6.1.1.2.1.9.1:

> Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location

Ethereum Mainnet - Transfer USDC to Binance (receive USDT) Instance Configuration Document · A.6.1.1.1.2.6.1.3.1.9.1:

> Ethereum Mainnet - Transfer USDC to Binance (receive USDT) Instance Configuration Document

Corrected fix: `Retitle A.6.1.1.1.2.6.1.1.2.1.9.1 as: Ethereum Mainnet - Transfer USDC to Binance (receive USDT) Instance Configuration Document Location`

**Action:** kept, severity medium, fix corrected.

### 27. A.6.1.1.1.2.6.1.1.2.1.9.1 Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location — duplicate

Sweep id `A.6.1.1.1.2.6.1.1.2.1.9.1#naming-2` (`fddc6d87-9d31-4234-995d-08fac2f23ef9`), factual pass, category `naming`. The Location title adds a stray 'Binance' that the linked ICD title (A.6.1.1.1.2.6.1.3.1.9.1) does not have. Sibling Location titles (e.g. A.6.1.1.1.2.6.1.1.2.1.10.1) mirror their ICD title, and sibling 9.2 has the same defect.

Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location · A.6.1.1.1.2.6.1.1.2.1.9.1:

> Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location

Ethereum Mainnet - Binance Transfer USDC to Binance (receive USDT) Instance Configuration Document Location · A.6.1.1.1.2.6.1.1.2.1.9.1:

> [A.6.1.1.1.2.6.1.3.1.9.1 - Ethereum Mainnet - Transfer USDC to Binance (receive USDT) Instance Configuration Document]

**Action:** rejected (duplicate of row 26).

### 28. A.6.1.1.1.2.6.1.1.2.1.9.2 Ethereum Mainnet - Binance Transfer USDT to Binance (receive USDC) Instance Configuration Document Location — real

Sweep id `A.6.1.1.1.2.6.1.1.2.1.9.2#naming` (`9b9d6744-b3b4-4cc8-9649-ae60a8db20a6`), language pass, category `naming`. A.6.1.1.1.2.6.1.1.2.1.9.2 names the instance "Binance Transfer USDT to Binance (receive USDC)", but the ICD it links (A.6.1.1.1.2.6.1.3.1.9.2) names it "Transfer USDT to Binance (receive USDC)".

Ethereum Mainnet - Binance Transfer USDT to Binance (receive USDC) Instance Configuration Document Location · A.6.1.1.1.2.6.1.1.2.1.9.2:

> Ethereum Mainnet - Binance Transfer USDT to Binance (receive USDC) Instance Configuration Document Location

Ethereum Mainnet - Transfer USDT to Binance (receive USDC) Instance Configuration Document · A.6.1.1.1.2.6.1.3.1.9.2:

> Ethereum Mainnet - Transfer USDT to Binance (receive USDC) Instance Configuration Document

Corrected fix: `Retitle A.6.1.1.1.2.6.1.1.2.1.9.2 as: Ethereum Mainnet - Transfer USDT to Binance (receive USDC) Instance Configuration Document Location`

**Action:** kept, severity medium, fix corrected.

### 29. A.6.1.1.1.2.6.1.1.2.3.1 Spark Savings V2 — false positive

Sweep id `A.6.1.1.1.2.6.1.1.2.3.1#naming` (`7539e9b2-453b-46b7-8d7c-f776d485914a`), language pass, category `naming`. Every Spark Savings directory heading (e.g. A.6.1.1.1.2.6.1.1.2.1.4, A.6.1.1.1.2.6.1.3.1.4) writes "V2", so this is a consistent Title Case heading convention, not a one-off slip.

Spark Savings V2 · A.6.1.1.1.2.6.1.1.2.3.1:

> Spark Savings V2

Spark Savings V2 · A.6.1.1.1.2.6.1.1.2.1.4:

> Spark Savings V2

Spark Savings V2 · A.6.1.1.1.2.6.1.3.3.1:

> Spark Savings V2

**Action:** rejected.

### 30. A.6.1.1.1.2.6.1.1.3.2.1.1 Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document Location — real

Sweep id `A.6.1.1.1.2.6.1.1.3.2.1.1#naming` (`cb87926d-f011-47ff-a0ab-81a057016ed6`), language pass, category `naming`. The two titles do disagree. The odd one out is the linked ICD A.6.1.1.1.2.6.1.4.2.1.1 ("Base Mainnet"): every other Base heading, e.g. A.6.1.1.1.2.6.1.4.2.2.1, says "Base -".

Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document Location · A.6.1.1.1.2.6.1.1.3.2.1.1:

> Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document Location

Base Mainnet - Fluid sUSDS ERC4626 Vault Instance Configuration Document · A.6.1.1.1.2.6.1.4.2.1.1:

> Base Mainnet - Fluid sUSDS ERC4626 Vault Instance Configuration Document

Base - Aave USDC Instance Configuration Document · A.6.1.1.1.2.6.1.4.2.2.1:

> Base - Aave USDC Instance Configuration Document

Corrected fix: `Retitle A.6.1.1.1.2.6.1.4.2.1.1 as "Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document" and update the link text in A.6.1.1.1.2.6.1.1.3.2.1.1 to match`

**Action:** kept, fix corrected.

### 31. A.6.1.1.1.2.6.1.1.3.2.1.1 Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document Location — duplicate

Sweep id `A.6.1.1.1.2.6.1.1.3.2.1.1#xref` (`cb87926d-f011-47ff-a0ab-81a057016ed6`), factual pass, category `xref`. The link label correctly matches its target's title, so the xref holds. The real inconsistency is that ICD A.6.1.1.1.2.6.1.4.2.1.1 says 'Base Mainnet', while its Location doc and the Base Aave ICD A.6.1.1.1.2.6.1.4.2.2.1 say 'Base'.

Base Mainnet - Fluid sUSDS ERC4626 Vault Instance Configuration Document · A.6.1.1.1.2.6.1.4.2.1.1:

> Base Mainnet - Fluid sUSDS ERC4626 Vault Instance Configuration Document

Base - Aave USDC Instance Configuration Document · A.6.1.1.1.2.6.1.4.2.2.1:

> Base - Aave USDC Instance Configuration Document

Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document Location · A.6.1.1.1.2.6.1.1.3.2.1.1:

> Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document Location

Corrected fix: `Retitle A.6.1.1.1.2.6.1.4.2.1.1 to 'Base - Fluid sUSDS ERC4626 Vault Instance Configuration Document' (matching its Location doc and the sibling Base Aave ICD), and update this link label to match.`

**Action:** rejected (duplicate of row 30).

### 33. A.6.1.1.1.2.6.1.2.1.1.3.6.3.1 Maximum USDC Bridged From Ethereum Mainnet To Avalanche Via Circle CCTP — false positive

Sweep id `A.6.1.1.1.2.6.1.2.1.1.3.6.3.1#entity` (`0de9f0f1-ccef-4f17-b699-7dedb79673b9`), factual pass, category `entity`. Spark labels its per-destination CCTP limits with a chain suffix throughout (`LIMIT_USDC_TO_CCTP_BASE` in A.6.1.1.1.2.6.1.2.1.1.3.2.7.1, `_ETH` in .3.1.4.1), so `_AVALANCHE` follows house style and is not a misnaming.

Maximum USDC Bridged From Ethereum Mainnet To Base Via Circle CCTP · A.6.1.1.1.2.6.1.2.1.1.3.2.7.1:

> (`LIMIT_USDC_TO_CCTP_BASE`)

Maximum USDC Bridged To Ethereum Mainnet Via Circle CCTP · A.6.1.1.1.2.6.1.2.1.1.3.1.4.1:

> (`LIMIT_USDC_TO_CCTP_ETH`)

**Action:** rejected.

### 34. A.6.1.1.1.2.6.1.3.1.5.1.2.2.3 Pool Address — false positive

Sweep id `A.6.1.1.1.2.6.1.3.1.5.1.2.2.3#entity` (`8efbce12-9417-4ab7-9e55-6194ee592bd4`), factual pass, category `entity`. A pool whose share token is the pool contract itself has the same Token and Pool Address; the Curve ICD (A.6.1.1.1.2.6.1.3.1.2.1.2.2.1/.4) shows the same identical pairing.

Token Address · A.6.1.1.1.2.6.1.3.1.2.1.2.2.1:

> `0xD001aE433f254283FeCE51d4ACcE8c53263aa186`

Pool Address · A.6.1.1.1.2.6.1.3.1.2.1.2.2.4:

> `0xD001aE433f254283FeCE51d4ACcE8c53263aa186`

Token Address · A.6.1.1.1.2.6.1.3.1.5.1.2.2.1:

> `0x38464507E02c983F20428a6E8566693fE9e422a9`

**Action:** rejected.

### 35. A.6.1.1.1.2.6.1.3.1.9.2.2.3.1 OTC Swap Rate Limit ID — false positive

Sweep id `A.6.1.1.1.2.6.1.3.1.9.2.2.3.1#entity` (`1fffefe8-44db-435a-b180-c0bd13053807`), factual pass, category `entity`. The two Binance ICDs state that their OTC swap rate limit is shared with each other (A.6.1.1.1.2.6.1.3.1.9.2.2.4.1 and 9.1.2.4.1), so an identical RateLimitID is intended.

OTC Swap Rate Limit · A.6.1.1.1.2.6.1.3.1.9.2.2.4.1:

> The OTC swap rate limit parameters, shared with [A.6.1.1.1.2.6.1.3.1.9.1 - Ethereum Mainnet - Transfer USDC to Binance (receive USDT) Instance Configuration Document]

**Action:** rejected.

### 36. A.6.1.1.1.2.6.1.3.2.1.1.3 Instance-specific Operational Processes — real

Sweep id `A.6.1.1.1.2.6.1.3.2.1.1.3#grammar` (`9b849363-5380-406f-888a-d533f6ec69de`), language pass, category `grammar`. A.6.1.1.1.2.6.1.3.2.1.1.3 runs "procedures see [" together. Sibling ICDs (e.g. A.6.1.1.1.2.6.1.4.2.1.1.3) write "procedures specified in [...] and, for emergency procedures, [...]".

Instance-specific Operational Processes · A.6.1.1.1.2.6.1.3.2.1.1.3:

> The Instance follows the general ERC4626 procedures see [

Instance-specific Operational Processes · A.6.1.1.1.2.6.1.4.2.1.1.3:

> This Instance follows the general ERC-4626 procedures specified in [

Corrected fix: `The Instance follows the general ERC4626 procedures specified in [...] and, for emergency procedures, [...]`

**Action:** kept, severity medium, fix corrected.

### 38. A.6.1.1.1.2.6.1.4.1.4.1.3.3 Remove A Delegated Signer In The Ethena Minter Contract — real

Sweep id `A.6.1.1.1.2.6.1.4.1.4.1.3.3#naming` (`40d3f261-a7f3-4cd9-b92b-3a79872eb339`), language pass, category `naming`. The A.6.1.1.1.2.6.1.4.1.4.1.3.3 title says "Ethena Minter", but its body and its siblings .3.2 and .3.5 use the contract name "EthenaMinter".

Remove A Delegated Signer In The Ethena Minter Contract · A.6.1.1.1.2.6.1.4.1.4.1.3.3:

> Remove A Delegated Signer In The Ethena Minter Contract

Remove A Delegated Signer In The Ethena Minter Contract · A.6.1.1.1.2.6.1.4.1.4.1.3.3:

> remove a delegated signer from the EthenaMinter contract

**Action:** kept, severity medium.

### 39. A.6.1.1.1.2.6.1.4.1.4.1.3.4 Approve Minting of USDe By Ethena Minter Contract — real

Sweep id `A.6.1.1.1.2.6.1.4.1.4.1.3.4#naming` (`43775285-0a42-44d8-bc3f-acc80f97a8f3`), language pass, category `naming`. The A.6.1.1.1.2.6.1.4.1.4.1.3.4 title says "Ethena Minter", but its body and its sibling .3.5 ("By EthenaMinter Contract") use "EthenaMinter".

Approve Minting of USDe By Ethena Minter Contract · A.6.1.1.1.2.6.1.4.1.4.1.3.4:

> Approve Minting of USDe By Ethena Minter Contract

Approve Minting of USDe By Ethena Minter Contract · A.6.1.1.1.2.6.1.4.1.4.1.3.4:

> approve the minting of USDe by the EthenaMinter contract

**Action:** kept, severity medium.

### 40. A.6.1.1.1.2.6.1.4.1.4.2.3 Instance-specific Operational Processes — real

Sweep id `A.6.1.1.1.2.6.1.4.1.4.2.3#grammar` (`3c72575c-ce4e-4379-ba45-080f335851a1`), language pass, category `grammar`. A.6.1.1.1.2.6.1.4.1.4.2.3 writes "specific for this instance"; the standard collocation is "specific to".

Instance-specific Operational Processes · A.6.1.1.1.2.6.1.4.1.4.2.3:

> For detailed logic specific for this instance

**Action:** kept, severity medium.

### 41. A.6.1.1.1.3.5.3.2.3.9 Spark Savings USDC on X Layer — real

Sweep id `A.6.1.1.1.3.5.3.2.3.9#xref` (`fac0c3d0-03d4-4d0b-b1ef-50c14e126924`), factual pass, category `xref`. The link label calls A.6.1.1.1.3.5.2.2.9 'Onchain Parameters', but that doc is titled 'Spark Savings USDC on X Layer'. The same label recurs in siblings 3.2.3.2 and 3.2.3.6-3.2.3.8.

Spark Savings USDC on X Layer · A.6.1.1.1.3.5.3.2.3.9:

> [A.6.1.1.1.3.5.2.2.9 - Onchain Parameters](c5a6c702-dcbc-4c31-8c61-9ca1b9fdca20)

Spark Savings USDC on X Layer · A.6.1.1.1.3.5.2.2.9:

> Spark Savings USDC on X Layer

**Action:** kept, severity medium.

### 42. A.6.1.1.1.3.9.7.2.4 Sentora RLUSD Morpho Vault - Ethereum Mainnet — false positive

Sweep id `A.6.1.1.1.3.9.7.2.4#entity` (`67d8abe9-a398-4c7c-9e0d-ee48e97489e1`), factual pass, category `entity`. No Atlas rule bars one multisig from holding both the Sentinel and Allocator roles. A.6.1.1.1.3.9.7.2.4 lists both deliberately, and the finding only asks for confirmation.

Sentora RLUSD Morpho Vault - Ethereum Mainnet · A.6.1.1.1.3.9.7.2.4:

> - Allocator: Sentora, at `0x9e396dE3312D373b87F9BD8763fb48184b42aac0` and at `0xC4Ba4e822C420452fe2BAB93211208D3CcBd79D3`

**Action:** rejected.

### 43. A.6.1.1.2.2.2.2.2.1.2.1.5 Root Edit Artifact Update — false positive

Sweep id `A.6.1.1.2.2.2.2.2.1.2.1.5#xref` (`a3dcb3c9-7e5a-48b1-aac8-9af4b5dfcfc2`), factual pass, category `xref`. This is the same template text as A.6.1.1.1.2.2.2.2.1.2.1.4. The link text is the URL itself, and the pulls page is part of the repository and is where Atlas updates are made.

Root Edit Artifact Update · A.6.1.1.2.2.2.2.2.1.2.1.5:

> the Atlas GitHub repository located at [https://github.com/sky-ecosystem/next-gen-atlas/pulls](https://github.com/sky-ecosystem/next-gen-atlas/pulls)

**Action:** rejected.

### 44. A.6.1.1.2.2.6.1.2.2.1.1.1.1 Default Admin Role — real, re-filed

Sweep id `A.6.1.1.2.2.6.1.2.2.1.1.1.1#markdown` (`dc515367-2fa0-4f98-b3d1-1b82d7ce782f`), language pass, category `markdown`. The constructor in A.6.1.1.2.2.6.1.2.2.1.1.1.1 is missing its closing brace before the fence. The equivalent blocks (e.g. A.6.1.1.3.2.6.1.2.2.1.1.1.1) close it. It is truncated code, not a markdown fault.

Default Admin Role · A.6.1.1.2.2.6.1.2.2.1.1.1.1:

> constructor(address admin) {
>         _grantRole(DEFAULT_ADMIN_ROLE, admin);
> ```

Default Admin Role · A.6.1.1.3.2.6.1.2.2.1.1.1.1:

> _grantRole(DEFAULT_ADMIN_ROLE, admin_);
> }

**Action:** re-filed as `typo`, severity medium.

### 45. A.6.1.1.2.2.6.1.3.1.4.3.2.4.1 Deposit Rate Limit (via FalconX) — real

Sweep id `A.6.1.1.2.2.6.1.3.1.4.3.2.4.1#numeric` (`7a93740b-d794-4ca9-aece-6c7db42bebf2`), factual pass, category `numeric`. Slope is a rate but has no time unit; the FalconX docs (A.6.1.1.2.2.6.1.3.1.4.3/.4.2.4.x) are the only Grove rate limits without 'per day', e.g. A.6.1.1.2.2.6.1.3.1.4.1.2.4.1.

Deposit Rate Limit (via FalconX) · A.6.1.1.2.2.6.1.3.1.4.3.2.4.1:

> - `slope`: 50 million USDC

Inflow Rate Limit · A.6.1.1.2.2.6.1.3.1.4.1.2.4.1:

> `slope`: 100,000,000 per day

**Action:** kept, severity medium.

### 46. A.6.1.1.2.2.6.1.3.1.4.3.2.4.2 Withdrawal Rate Limit (via FalconX) — real

Sweep id `A.6.1.1.2.2.6.1.3.1.4.3.2.4.2#numeric` (`e198f465-0b25-4f45-860f-66eacc575f9f`), factual pass, category `numeric`. Slope lacks a time unit, unlike other Grove rate limits such as A.6.1.1.2.2.6.1.3.1.4.1.2.4.2 which state 'per day'.

Withdrawal Rate Limit (via FalconX) · A.6.1.1.2.2.6.1.3.1.4.3.2.4.2:

> - `slope`: 50 million USDC

Outflow Rate Limit · A.6.1.1.2.2.6.1.3.1.4.1.2.4.2:

> `slope`: 200,000,000 per day

**Action:** kept, severity medium.

### 47. A.6.1.1.2.2.6.1.3.1.4.4.2.4.1 Deposit Rate Limit (via FalconX) — real

Sweep id `A.6.1.1.2.2.6.1.3.1.4.4.2.4.1#numeric` (`e66a0529-5419-46ef-8b9c-e6f6c255c3e3`), factual pass, category `numeric`. Slope lacks a time unit, unlike other Grove rate limits such as A.6.1.1.2.2.6.1.3.1.4.1.2.4.1 which state 'per day'.

Deposit Rate Limit (via FalconX) · A.6.1.1.2.2.6.1.3.1.4.4.2.4.1:

> - `slope`: 50 million USDC

Inflow Rate Limit · A.6.1.1.2.2.6.1.3.1.4.1.2.4.1:

> `slope`: 100,000,000 per day

**Action:** kept, severity medium.

### 48. A.6.1.1.2.2.6.1.3.1.4.4.2.4.2 Withdrawal Rate Limit (via FalconX) — real

Sweep id `A.6.1.1.2.2.6.1.3.1.4.4.2.4.2#numeric` (`c3fa15e7-7193-4e4d-9463-9dc6001f3d75`), factual pass, category `numeric`. Slope lacks a time unit, unlike other Grove rate limits such as A.6.1.1.2.2.6.1.3.1.4.1.2.4.2 which state 'per day'.

Withdrawal Rate Limit (via FalconX) · A.6.1.1.2.2.6.1.3.1.4.4.2.4.2:

> - `slope`: 50 million USDC

Outflow Rate Limit · A.6.1.1.2.2.6.1.3.1.4.1.2.4.2:

> `slope`: 200,000,000 per day

**Action:** kept, severity medium.

### 49. A.6.1.1.2.2.6.1.3.1.7.5.2.2.6 Allocator Role Addresses — real

Sweep id `A.6.1.1.2.2.6.1.3.1.7.5.2.2.6#entity` (`80038f9f-d01e-45c1-8f51-cfb73cff1f6f`), factual pass, category `entity`. All four sibling Grove x Steakhouse vaults (e.g. A.6.1.1.2.2.6.1.3.1.7.4.2.2.6) list a sixth allocator 0xfeed46…3C9a after the same five rows; the PYUSD table omits it, likely a dropped row.

Allocator Role Addresses · A.6.1.1.2.2.6.1.3.1.7.5.2.2.6:

> | Steakhouse Financial | `0xfC580f2a77e85f1F47b60F096D36fDc97cE2d827` |

Allocator Role Addresses · A.6.1.1.2.2.6.1.3.1.7.4.2.2.6:

> | Steakhouse Financial | `0xfeed46c11F57B7126a773EeC6ae9cA7aE1C03C9a` |

Corrected fix: `Add the row "| Steakhouse Financial | '0xfeed46c11F57B7126a773EeC6ae9cA7aE1C03C9a' |" after the '0xfC580f…d827' row, if that allocator is set on the PYUSD vault.`

**Action:** kept, fix corrected.

### 50. A.6.1.1.2.2.6.1.3.1.11.1.2.3 Rate Limit IDs — false positive

Sweep id `A.6.1.1.2.2.6.1.3.1.11.1.2.3#structural` (`c5462c4a-eb73-40c3-bc66-6224fb0d7359`), factual pass, category `structural`. A.6.1.1.2.2.6.1.3.1.11.1.2.3 has Inflow, Outflow, Mint and Redeem RateLimitID children, and sibling Rate Limits .4 has Deposit, Withdrawal, Mint and Redeem limits; all four operations are covered.

Mint RateLimitID · A.6.1.1.2.2.6.1.3.1.11.1.2.3.3:

> The mint RateLimitID is:

Redeem Rate Limit · A.6.1.1.2.2.6.1.3.1.11.1.2.4.4:

> The redeem rate limit parameters are:

**Action:** rejected.

### 51. A.6.1.1.2.2.6.1.3.1.11.1.2.4 Rate Limits — false positive

Sweep id `A.6.1.1.2.2.6.1.3.1.11.1.2.4#structural` (`d60717bb-c122-49b9-9617-d121c05f60cb`), factual pass, category `structural`. A.6.1.1.2.2.6.1.3.1.11.1.2.4 has four children: Deposit, Withdrawal, Mint (.4.3) and Redeem (.4.4) Rate Limits, matching the four operations named.

Mint Rate Limit · A.6.1.1.2.2.6.1.3.1.11.1.2.4.3:

> The mint rate limit parameters are:

Redeem Rate Limit · A.6.1.1.2.2.6.1.3.1.11.1.2.4.4:

> The redeem rate limit parameters are:

**Action:** rejected.

### 53. A.6.1.1.3.2.2.2.2.1.2.1.5 Root Edit Artifact Update — false positive

Sweep id `A.6.1.1.3.2.2.2.2.1.2.1.5#xref` (`293c49b9-48f4-433c-820f-4915696f742f`), factual pass, category `xref`. Text says 'repository located at' but links the /pulls list; the same template wording recurs in every Prime's Root Edit Artifact Update (e.g. A.6.1.1.2.2.2.2.2.1.2.1.5).

Root Edit Artifact Update · A.6.1.1.3.2.2.2.2.1.2.1.5:

> update the Atlas GitHub repository located at [https://github.com/sky-ecosystem/next-gen-atlas/pulls](https://github.com/sky-ecosystem/next-gen-atlas/pulls)

**Action:** rejected (review override).
