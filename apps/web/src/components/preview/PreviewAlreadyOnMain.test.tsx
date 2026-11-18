// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

let alreadyOnMain: Set<string> | undefined;
vi.mock("../../lib/previewDiff", () => ({ usePreviewDiff: () => ({ alreadyOnMain }) }));

import { PreviewAlreadyOnMain } from "./PreviewAlreadyOnMain";

afterEach(cleanup);

describe("PreviewAlreadyOnMain", () => {
  it("says how many changes main already has", () => {
    alreadyOnMain = new Set(["a", "b"]);
    expect(render(<PreviewAlreadyOnMain />).container.textContent).toBe("· 2 changes already on main, not shown");
    cleanup();
    alreadyOnMain = new Set(["a"]);
    expect(render(<PreviewAlreadyOnMain />).container.textContent).toBe("· 1 change already on main, not shown");
  });

  it("says nothing when there are none, or the build recorded none", () => {
    alreadyOnMain = new Set();
    expect(render(<PreviewAlreadyOnMain />).container.textContent).toBe("");
    alreadyOnMain = undefined;
    expect(render(<PreviewAlreadyOnMain />).container.textContent).toBe("");
  });
});
