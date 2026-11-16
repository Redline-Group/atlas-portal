// @vitest-environment jsdom
// What an address card says about when its chain values were read: the "as of"
// row under the holdings, and the read time and block on the view-function heading.
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AddressCard } from "./AddressCard";
import { makeAddressInfo } from "../test/fixtures";
import { resetSharedBalances } from "../lib/sharedBalances";

const peeked = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/balances", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  loadBalancesCached: () => new Promise(() => {}),
  peekCachedBalances: () => peeked.current,
}));
vi.mock("../lib/chainstate", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  loadChainState: () => Promise.resolve({ block: "21000000", values: {}, fetchedAt: "2026-11-16T14:02:45Z" }),
}));

const ADDR = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84";
const holdings = (checkedAt: string | null, prices: object) => {
  peeked.current = {
    addresses: {
      [`${ADDR}|ethereum`]: {
        chain: "ethereum",
        checkedAt,
        hasCode: null,
        balances: { ETH: { raw: "2000000000000000000", decimals: 18 } },
      },
    },
    prices,
  };
  resetSharedBalances();
};

beforeEach(() => {
  peeked.current = null;
  resetSharedBalances();
});
afterEach(cleanup);

describe("AddressCard as-of", () => {
  it("says when the balances were read and when the prices were quoted", () => {
    holdings("2026-11-16T14:02:10Z", { ETH: { usd: 3000, asOf: new Date().toISOString() } });
    const { container } = render(<AddressCard address={ADDR} info={makeAddressInfo({ chains: ["ethereum"] })} />);
    const row = [...container.querySelectorAll("dt")].find((dt) => dt.textContent === "as of")!;
    expect(row.nextElementSibling).toHaveTextContent("read 2026-11-16 14:02 UTC");
    expect(row.nextElementSibling).toHaveTextContent("prices");
    expect(row.nextElementSibling).toHaveTextContent("DefiLlama");
    expect(row.nextElementSibling?.querySelector("[data-source='onchain']")).not.toBeNull();
    expect(row.nextElementSibling?.querySelector("[data-source='external']")).not.toBeNull();
  });

  it("leaves out the price clause when nothing held is priced, and the row when no time is known", () => {
    holdings("2026-11-16T14:02:10Z", {});
    const { container, rerender } = render(<AddressCard address={ADDR} info={makeAddressInfo({ chains: ["ethereum"] })} />);
    const text = () => [...container.querySelectorAll("dt")].find((dt) => dt.textContent === "as of")?.nextElementSibling?.textContent;
    expect(text()).toContain("read 2026-11-16 14:02 UTC");
    expect(text()).not.toContain("prices");
    holdings(null, {});
    rerender(<AddressCard address={ADDR} info={makeAddressInfo({ chains: ["ethereum"] })} key="again" />);
    expect(text()).toBeUndefined();
  });

  it("puts the snapshot's read time and block on the view-function heading", async () => {
    const { container } = render(<AddressCard address={ADDR} info={makeAddressInfo()} chainValues={{ live: true }} />);
    await waitFor(() => {
      const mark = container.querySelector("[data-source='onchain']")!;
      expect(mark).toHaveTextContent("read 2026-11-16 14:02 UTC · block 21,000,000");
    });
    expect(screen.getByText("view functions")).toBeInTheDocument();
  });
});
