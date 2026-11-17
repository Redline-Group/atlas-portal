// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useShowInMain } from "./useShowInMain";

const trackMock = vi.hoisted(() => vi.fn());
vi.mock("../../lib/analytics", () => ({ track: trackMock }));

afterEach(() => window.history.replaceState(null, "", "/"));

describe("useShowInMain", () => {
  it("records the doc shown in the main reader, then selects it", () => {
    window.history.replaceState(null, "", "/atlas?id=doc-a&split=doc-b");
    const navigate = vi.fn();
    const { result } = renderHook(() => useShowInMain(navigate));
    act(() => result.current("doc-c", "link"));
    expect(navigate).toHaveBeenCalledWith("doc-c");
    expect(trackMock).toHaveBeenCalledWith("reader_split_show_in_main", {
      node_id: "doc-a",
      split_id: "doc-b",
      target_id: "doc-c",
      via: "link",
    });
    act(() => result.current("doc-d"));
    expect(trackMock).toHaveBeenLastCalledWith("reader_split_show_in_main", expect.objectContaining({ via: "row" }));
  });
});
