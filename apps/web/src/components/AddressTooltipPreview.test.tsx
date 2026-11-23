// @vitest-environment jsdom
// The hover card in a preview: an address the preview brings in is marked new,
// and a known Safe the preview places on an unread chain still shows its signers.
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AddressTooltipPreview } from "./AddressTooltipPreview";
import { AddressTooltipSafe } from "./AddressTooltipSafe";

const diff = vi.hoisted(() => ({ introducedAddresses: undefined as Set<string> | undefined }));
vi.mock("../lib/previewDiff", () => ({ usePreviewDiff: () => diff }));

const SPARK = "0x492aae70e59551768baf3c7159d3f951b6ed76fe";
const OWNERS = ["0x7577ebdccc61abe17e09d3cedea554d6ca0673ff", "0xf1aec1e61abc9f6dddff52715af990cab42f4720", "0xb338081af37fe3adc3f515876736a47684917290"];

afterEach(() => {
  cleanup();
  diff.introducedAddresses = undefined;
});

describe("AddressTooltipPreview", () => {
  it("marks an address the preview brings in, matching a checksummed spelling", () => {
    diff.introducedAddresses = new Set([SPARK]);
    render(<dl><AddressTooltipPreview address="0x492aae70E59551768BAF3c7159d3f951B6ed76Fe" /></dl>);
    expect(screen.getByText("+ new in this Edit")).toBeInTheDocument();
  });

  it("says nothing for an address the diff base names, or outside a preview", () => {
    const { container, rerender } = render(<dl><AddressTooltipPreview address={SPARK} /></dl>);
    expect(container.querySelector("[data-preview-new]")).toBeNull();
    diff.introducedAddresses = new Set(["0xabcdef0000000000000000000000000000000001"]);
    rerender(<dl><AddressTooltipPreview address={SPARK} /></dl>);
    expect(container.querySelector("[data-preview-new]")).toBeNull();
  });
});

describe("AddressTooltipSafe read elsewhere", () => {
  it("names the chains the reading came from, with the signers", () => {
    render(<dl><AddressTooltipSafe safe={{ threshold: 2, owners: OWNERS, chains: ["arbitrum", "base"], atlas: null, elsewhere: true }} /></dl>);
    expect(screen.getByText("read on")).toBeInTheDocument();
    expect(document.querySelector("[data-read-elsewhere]")).toHaveTextContent("arbitrum, base");
    expect(document.querySelector("[data-threshold]")?.parentElement).toHaveTextContent(/^2 \/ 3$/);
    expect(screen.getByRole("list", { name: "Signers" }).children).toHaveLength(3);
  });

  it("keeps the plain chain suffix for a reading on the atlas's own chains", () => {
    render(<dl><AddressTooltipSafe safe={{ threshold: 2, owners: OWNERS, chains: ["arbitrum", "base"], atlas: null, elsewhere: false }} /></dl>);
    expect(screen.queryByText("read on")).toBeNull();
    expect(document.querySelector("[data-threshold]")?.parentElement).toHaveTextContent("2 / 3 · arbitrum, base");
  });
});
