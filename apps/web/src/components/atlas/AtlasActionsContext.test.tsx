// @vitest-environment jsdom
// Shift-clicking a doc link inside the reader does what shift-clicking that
// doc's row does: the provider's splitNavigate, tagged via "link". The
// direction comes from whichever provider the link renders under, so a link in
// a portal (an address tooltip) follows the pane it was opened from. Outside
// the reader there is no provider and the browser keeps its own shift-click.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act, renderHook } from "@testing-library/react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { AtlasActionsContext } from "./AtlasActionsContext";
import { useShowInMain } from "./useShowInMain";
import { AtlasLink } from "../AtlasLink";
import NodeContentInner from "../NodeContentInner";
import { atlasHref } from "@/lib/routes";

const trackMock = vi.hoisted(() => vi.fn());
vi.mock("../../lib/analytics", () => ({ track: trackMock }));

const UUID = "1ce24b08-84ff-4524-9710-49bba429c6ef";

function inReader(children: ReactNode) {
  const actions = { navigate: vi.fn(), toggle: vi.fn(), splitNavigate: vi.fn() };
  render(<AtlasActionsContext.Provider value={actions}>{children}</AtlasActionsContext.Provider>);
  return actions;
}

afterEach(() => {
  cleanup();
  trackMock.mockClear();
  window.history.replaceState(null, "", "/");
});

describe("doc links inside the reader", () => {
  it("routes an AtlasLink shift-click to splitNavigate", () => {
    const actions = inReader(<AtlasLink to={atlasHref("doc-a")}>go</AtlasLink>);
    const notCancelled = fireEvent.click(screen.getByText("go"), { shiftKey: true });
    expect(actions.splitNavigate).toHaveBeenCalledWith("doc-a", "link");
    expect(notCancelled).toBe(false);
  });

  it("routes a content link's shift-click to splitNavigate instead of opening it", async () => {
    const onNavigate = vi.fn();
    const actions = inReader(<NodeContentInner content={`[Go](${UUID})`} onNavigate={onNavigate} />);
    fireEvent.click(await screen.findByRole("link", { name: "Go" }), { shiftKey: true });
    expect(actions.splitNavigate).toHaveBeenCalledWith(UUID, "link");
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("follows the provider through a portal", () => {
    const actions = inReader(createPortal(<AtlasLink to={atlasHref("doc-a")}>tip</AtlasLink>, document.body));
    fireEvent.click(screen.getByText("tip"), { shiftKey: true });
    expect(actions.splitNavigate).toHaveBeenCalledWith("doc-a", "link");
  });

  it("leaves plain clicks and other modifier combinations alone", () => {
    const actions = inReader(<AtlasLink to={atlasHref("doc-a")}>go</AtlasLink>);
    const link = screen.getByText("go");
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    fireEvent.click(link, { shiftKey: true, metaKey: true });
    expect(actions.splitNavigate).not.toHaveBeenCalled();
  });

  it("keeps the browser's shift-click outside the reader", () => {
    render(<AtlasLink to={atlasHref("doc-a")}>go</AtlasLink>);
    // A document-level listener sees whether anything cancelled the click, and
    // cancels it afterwards so jsdom does not try to follow the link.
    let cancelled: boolean | null = null;
    const watch = (e: MouseEvent) => {
      cancelled = e.defaultPrevented;
      e.preventDefault();
    };
    document.addEventListener("click", watch);
    fireEvent.click(screen.getByText("go"), { shiftKey: true });
    document.removeEventListener("click", watch);
    expect(cancelled).toBe(false);
  });
});

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
