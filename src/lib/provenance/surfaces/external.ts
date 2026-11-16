import type { SourceSurface } from "./types";

export const EXTERNAL_SURFACES: readonly SourceSurface[] = [
  {
    name: "Settlement workbooks",
    from: "Soter Labs' monthly settlement-cycle workbooks (soterlabs/settlement-reports), parsed by the app. The figures are an OEA calculation, not the on-chain GovOps spell. Series such as “supply kept” are our arithmetic over the workbook rows.",
    fresh: "Fetched when the app image is built, so as current as the last deploy.",
    where: "Radar's Settlements page and settlement teaser, and Chat answers about settlements.",
  },
  {
    name: "Sky vote record",
    from: "Executive votes (sky-ecosystem/executive-votes) and governance polls (sky-ecosystem/polls), joined to what vote.sky.money reports for each.",
    fresh: "Baked in at build time. The atlas worker lays a fresher record over it for Stale Dates, and the report names the range it covers.",
    where: "Stale Dates, and the Executive Votes listed on a document in the reader.",
  },
  {
    name: "Token prices",
    from: "DefiLlama quotes.",
    fresh: "Each price carries its quote time, shown beside the balances' read time.",
    where: "The value and holdings on address hover cards and cards.",
  },
  {
    name: "GitHub pull-request metadata",
    from: "GitHub's API: pull-request titles, authors and dates, kept in a cache that is refreshed in batches.",
    fresh: "Cached, so it can trail GitHub.",
    where: "Change history and PR previews.",
  },
  {
    name: "Address names and contract metadata",
    from: "Sky Chainlog labels and Etherscan verified-contract names, proxy and implementation details.",
    fresh: "Refreshed when the app's address data is rebuilt.",
    where: "Address names, proxy badges and explorer links.",
  },
];
