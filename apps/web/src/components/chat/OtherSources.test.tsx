// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ToolCallRecord } from "./api";
import { OtherSources } from "./OtherSources";

afterEach(cleanup);

const call = (name: string): ToolCallRecord => ({ name, args: {}, ok: true, bytes: 10 });

describe("OtherSources", () => {
  it("renders nothing when the answer used only Atlas text", () => {
    const { container } = render(<OtherSources content="It is 50M." calls={[call("atlas_get")]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a chip per tool-returned class and each classified link, counted together", () => {
    const { container } = render(
      <OtherSources
        content="It holds [45M](https://etherscan.io/address/0xabc) and [the workbook](https://github.com/soterlabs/settlement-reports/x)."
        calls={[call("redline_onchain"), call("external_msc")]}
      />,
    );
    expect(screen.getByText("other sources · 4")).toBeInTheDocument();
    const classChips = [...container.querySelectorAll(".rlc-sources-chips > [data-source]")].map((e) => e.getAttribute("data-source"));
    expect(classChips).toEqual(["onchain", "external"]);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["https://etherscan.io/address/0xabc", "https://github.com/soterlabs/settlement-reports/x"]);
    for (const l of links) expect(l).toHaveAttribute("target", "_blank");
    expect(container.querySelector("[data-source='onchain']")?.getAttribute("title")).toContain("redline_onchain");
  });

  it("marks a preview tool and a preview link with the preview's own mark", () => {
    const { container } = render(
      <OtherSources content={`See [that](/preview/${"a".repeat(40)}/atlas?id=${"b".repeat(36)}).`} calls={[call("atlas_preview_get")]} />,
    );
    expect(container.querySelectorAll("[data-source='preview']")).toHaveLength(2);
  });
});
