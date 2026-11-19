import type { FeatureGroup } from "../features-types.ts";

export const reports: FeatureGroup = {
    key: "reports",
    title: "Reports",
    route: "/reports",
    blurb:
      "Purpose-built tables built from the Atlas — each with CSV export and shareable, URL-synced filters.",
    features: [
      {
        name: "Using a report",
        what: "Extracted, filterable tables you can narrow and export.",
        how: [
          "Open Reports and pick one — they are grouped by subject: roles and duties, on-chain and money, rules and risk, Atlas structure, and Atlas health.",
          "Reports are rebuilt every time you open them. Chips beside a report's title, on its card and under its heading on the report page, name what it draws on besides Atlas text: on-chain reads, external records, derived data, AI or curated lists. A report with no chip is Atlas text only. Each chip links to the Provenance page's \u201cReading the marks\u201d legend.",
          "Use the filter pills to narrow; the URL updates so you can share the exact filtered view.",
          "Click Download CSV to export — full or filtered, with UUIDs and direct Atlas links. The file opens with comment lines (starting with #) naming the Atlas commit and the sources the report draws on.",
        ],
      },
      {
        name: "Finding a report",
        what: "The Reports list search matches names, categories, and descriptions, including similar phrasing.",
        how: [
          "Open Reports and type in the search pill — it filters the list in place.",
          "A name fragment jumps to that report; a subject group like roles and duties or Atlas health shows that group; a source word like curated, AI or on-chain finds the reports that draw on it.",
          "Describing what you want (wallet addresses, outdated dates) finds the matching report even when the title is different. Similar-meaning extras show under Closest meaning, not mixed in with name matches.",
        ],
      },
      {
        name: "AI-drafted assessments",
        what: "OEA Task Assessment and Risk Rules are rated by an LLM against a fixed published rubric, then human-reviewed.",
        how: [
          "Open OEA Task Assessment or Risk Rules; each row shows a rating plus per-task reasoning.",
          "Follow the link to the rubric page to see exactly what the ratings are scored against.",
        ],
        note: "Ratings are AI-drafted and human-reviewed — treat them as a starting point, not a verdict.",
      },
      {
        name: "Diamond PAU and Monolithic Controller to Review",
        what: "Every Prime Agent PAU value, controller and Atlas role claim an expert should look at, grouped by why: the Atlas is probably out of date, a spell or the Operator may not have acted yet, a spell executed without the change, the Atlas lacks the detail to check, a registry conflict, or ambiguous.",
        how: [
          "Open it from Reports, or click `N values to review` under a chain's `Rate limits` heading on a Prime Agent's Liquidity Layer Arch. (PAUs) page (it counts that deployment's) to see only that Prime's.",
          "Filter with the Group and Prime pills; each row shows what the Atlas states, what the chain holds, why it is listed, and the Atlas document stating it.",
          "Where a value is placed by which side moved last, the row shows both dates: when the chain last set it and when the Atlas last wrote the value. Where the Atlas moved later, the row follows the Atlas pull request that wrote the value to the spell it names, linked to the evidence: what that spell is still waiting on, or that it executed without the value (listed under `Spell executed without the change`), set it to another value (`Ambiguous`) or never executed; a pull request that names no spell is said so. A rate-limit row also says who can change the limit: a spell through its admin and, where BeamState and the Configurator allow it, the Operator, with how far the Operator can take it and the Atlas rule that says so; a Solana limit is set by spell alone, relayed to Solana through LayerZero governance, with the Atlas rules that say so. The Group pills, search and CSV (`Who can set it`) include it.",
        ],
        note: "Values that match, values the Atlas marks as not set, and values the reader has not read yet are left out. Without the server's document history, every disagreement is listed as ambiguous.",
      },
      {
        name: "Edit Candidates",
        what: "Everything in the Atlas text that may need an update, in one list: typos, grammar slips, broken cross-references, wrong figures and internal contradictions from an AI sweep, dates the text still phrases as upcoming after they passed, and Prime Agent values where the Atlas and the chain disagree — each one quoted and linked to its document.",
        how: [
          "Open Edit Candidates from Reports and filter with the pills: Confidence, Category, Found by, Scope, Executor agent, Doc status, Source, First found and Doc changed.",
          "Use the Source pills to see one kind of check at a time: `Text sweep`, `Stale dates` or `Atlas vs chain`. A row from Stale Dates or the PAU audit names its source under the category; click that name to open the report with the row's full detail.",
          "Use the First found pills (`last 7 days`, `last 30 days`, `last 90 days`) to see what is new, and the Doc changed pills to see candidates in documents the Atlas edited recently. A candidate with no recorded date is left out while one of these is picked.",
          "Read the Atlas text next to why it is listed, then follow the document link to check it at the source.",
          "On a phone, candidates show one at a time — swipe left or right, or use the previous/next buttons (or [←][→]). Filters start folded; tap the truncated disclaimer to read it in full.",
          "Use the Doc status pills to find candidates whose document has been renumbered or removed since it was swept. Sweep candidates whose quoted text is no longer in the Atlas — usually fixed upstream — are hidden; pick Quote no longer in doc to see them.",
          "Use the Scope pills to narrow to one top-level Atlas Scope, or the Executor agent pills to see the candidates in the Agent Artifacts an executor agent is accountable for (its Primes' artifacts and its own); each such row names its agent and executor under the doc number.",
          "Download the CSV for the same rows with their source, first-found date and the document's last-change date.",
        ],
        note: "Each row is a suspicion to check, not a confirmed error. The text sweep is AI-written and re-run automatically on new and changed documents, so a fresh Atlas edit can take a while to be read; where no background worker runs, the list shows the last committed sweep. The Atlas vs chain rows need the server's chain snapshots and the Doc changed pills need its document history; without them the banner says which source is unavailable and those pills are hidden.",
      },
      {
        name: "Vote evidence on Stale Dates",
        what: "Each dated claim on Stale Dates is checked against the Sky vote record on vote.sky.money (Executive Votes and governance polls), so you can tell a vote that happened but was never written up from one that did not happen.",
        how: [
          "Open Stale Dates; under each claim, a tag says what the vote record shows, in the Atlas's own terms — executed, not yet executed, not included, no Executive Vote on date, approved by poll, or no linked vote — with the matched vote linked to vote.sky.money and its offset in days.",
          "The Recorded votes section lists sentences that say a dated Executive Vote already did something, and checks those too: not included means the Executive Vote on that date never mentions what the Atlas credits to it.",
          "A claim that names no vote shows the governance poll that authorised it when the Atlas edit that wrote it can be traced to one.",
          "A tag such as “Executive Vote matched to doc via date” says how the vote was matched: via date (the sentence names the vote’s date), via link (the vote links the document), via history (traced through the Atlas edit that wrote the claim) or via AI (an AI model decided). Hover it for the details, including what the heuristic said where the AI overruled it.",
          "Hover a tag for what it means, type a tag (“not included”, “matched to doc via AI”) in the search pill to filter by it, or download the CSV for the vote columns.",
        ],
        note: "“No linked vote” is not evidence that none happened. “Via AI” and “via history” verdicts come from a background job and can lag a fresh Atlas edit by about an hour; until then a claim shows the rules' verdict. Hidden when the vote record has not been built (`pnpm votes:sync`).",
      },
    ],
  };
