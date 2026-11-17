import type { SourceSurface } from "./types";

export const ONCHAIN_SURFACES: readonly SourceSurface[] = [
  {
    name: "Address balances and Safe setups",
    from: "The atlas worker's rolling sweep of public RPC endpoints: one reading per address and chain.",
    fresh: "Each address carries its own read time, and the sweep revisits an address about daily.",
    where: "Address hover cards and cards (an “as of” row), the On-Chain Addresses and Multisigs reports.",
  },
  {
    name: "Liquidity Layer (PAU) contracts",
    from: "The contracts in our PAU registry. The atlas worker replays their admin events (from a block explorer, Envio HyperSync or JSON-RPC, depending on the chain) and reads rate limits and role holders live over RPC.",
    fresh: "Each deployment shows the time of its last read. † marks a value whose live read failed, and ‡ one whose token decimals were inferred.",
    where: "Radar's Liquidity Layer page, the “Atlas vs contract” tables, rate-limit hovers, the PAU audit and Rewards reports.",
  },
  {
    name: "Contract view-function values",
    from: "A daily snapshot of no-argument view functions through a public Ethereum RPC.",
    fresh: "The snapshot's block and read time sit on the “view functions” heading and in the footer.",
    where: "Address cards and the footer.",
  },
];
