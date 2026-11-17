// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AtlasMarkdown } from "./markdown";

afterEach(cleanup);

const UUID = "a".repeat(8) + "-aaaa-aaaa-aaaa-" + "a".repeat(12);

describe("AtlasMarkdown link marks", () => {
  it("picks the mark from where a link points: chain, outside record, and none for an Atlas citation", () => {
    const { container } = render(
      <AtlasMarkdown
        onAtlas={vi.fn()}
        content={`The limit is [50M](/atlas/${UUID}); it holds [45M](https://etherscan.io/address/0xabc); [the sheet](https://github.com/soterlabs/settlement-reports/x); [a blog](https://example.com/b).`}
      />,
    );
    const marks = [...container.querySelectorAll("[data-source]")].map((e) => e.getAttribute("data-source"));
    expect(marks).toEqual(["onchain", "external"]);
    const atlasLink = [...container.querySelectorAll("a")].find((a) => a.textContent === "50M")!;
    expect(atlasLink.nextElementSibling?.hasAttribute("data-source")).toBe(false);
    const chainLink = [...container.querySelectorAll("a")].find((a) => a.textContent === "45M")!;
    expect(chainLink.nextElementSibling).toHaveAttribute("data-source", "onchain");
  });
});
