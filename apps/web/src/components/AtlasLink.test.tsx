// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { AtlasLink } from "./AtlasLink";
import { AtlasActionsContext } from "./atlas/AtlasActionsContext";
import { atlasHref } from "@/lib/routes";
import { cancelledBefore, makeAtlasActions } from "../test/readerLinks";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("AtlasLink", () => {
  it("carries split and subset from the current URL into the target", () => {
    window.history.replaceState(null, "", "/atlas?id=old&split=cmp&subset=changed");
    const { container } = render(<AtlasLink to={atlasHref("new-id")}>go</AtlasLink>);
    const href = container.querySelector("a")!.getAttribute("href")!;
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("id")).toBe("new-id");
    expect(params.get("split")).toBe("cmp");
    expect(params.get("subset")).toBe("changed");
  });

  it("carries a preview's change filters along with subset=changed", () => {
    window.history.replaceState(null, "", "/atlas?id=old&subset=changed&change=new,edited&base=sky");
    const { container } = render(<AtlasLink to={atlasHref("new-id")}>go</AtlasLink>);
    const params = new URLSearchParams(container.querySelector("a")!.getAttribute("href")!.split("?")[1]);
    expect(params.get("subset")).toBe("changed");
    expect(params.get("change")).toBe("new,edited");
    expect(params.get("base")).toBe("sky");
  });

  it("drops the change filters when the destination picks its own subset", () => {
    window.history.replaceState(null, "", "/atlas?id=old&subset=changed&change=new");
    const { container } = render(<AtlasLink to={`${atlasHref("new-id")}&subset=selected`}>go</AtlasLink>);
    const params = new URLSearchParams(container.querySelector("a")!.getAttribute("href")!.split("?")[1]);
    expect(params.get("subset")).toBe("selected");
    expect(params.has("change")).toBe(false);
  });

  it("does not add split/subset when the destination already sets them", () => {
    window.history.replaceState(null, "", "/atlas?id=old&split=cmp&subset=changed");
    const { container } = render(
      <AtlasLink to={`${atlasHref("new-id")}&subset=selected`}>go</AtlasLink>,
    );
    const href = container.querySelector("a")!.getAttribute("href")!;
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("subset")).toBe("selected");
  });

  it("is a no-op when the current URL has neither split nor subset", () => {
    window.history.replaceState(null, "", "/atlas?id=old");
    const { container } = render(<AtlasLink to={atlasHref("new-id")}>go</AtlasLink>);
    const href = container.querySelector("a")!.getAttribute("href")!;
    expect(href).toBe(atlasHref("new-id"));
  });

  it("leaves non-atlas destinations untouched", () => {
    window.history.replaceState(null, "", "/atlas?id=old&split=cmp&subset=changed");
    const { container } = render(<AtlasLink to="/collections">go</AtlasLink>);
    expect(container.querySelector("a")!.getAttribute("href")).toBe("/collections");
  });
});

// Inside the reader a shift-click follows the row gesture: the provider's
// splitNavigate, tagged via "link". The direction comes from whichever provider
// the link renders under, so a link in a portal (an address tooltip) follows
// the pane it was opened from. Outside the reader there is no provider and the
// browser keeps its own shift-click.
describe("AtlasLink in the reader", () => {
  function inReader(children: ReactNode) {
    const actions = makeAtlasActions();
    render(<AtlasActionsContext.Provider value={actions}>{children}</AtlasActionsContext.Provider>);
    return actions;
  }

  it("routes a shift-click to splitNavigate", () => {
    const actions = inReader(<AtlasLink to={atlasHref("doc-a")}>go</AtlasLink>);
    expect(cancelledBefore(screen.getByText("go"), { shiftKey: true })).toBe(true);
    expect(actions.splitNavigate).toHaveBeenCalledWith("doc-a", "link");
  });

  it("follows the provider through a portal", () => {
    const actions = inReader(createPortal(<AtlasLink to={atlasHref("doc-a")}>tip</AtlasLink>, document.body));
    fireEvent.click(screen.getByText("tip"), { shiftKey: true });
    expect(actions.splitNavigate).toHaveBeenCalledWith("doc-a", "link");
  });

  it("leaves other modifier combinations to the browser", () => {
    const actions = inReader(<AtlasLink to={atlasHref("doc-a")}>go</AtlasLink>);
    expect(cancelledBefore(screen.getByText("go"), { shiftKey: true, metaKey: true })).toBe(false);
    expect(actions.splitNavigate).not.toHaveBeenCalled();
  });

  it("keeps the browser's shift-click outside the reader", () => {
    render(<AtlasLink to={atlasHref("doc-a")}>go</AtlasLink>);
    expect(cancelledBefore(screen.getByText("go"), { shiftKey: true })).toBe(false);
  });

  it("hands a plain click to onOpen instead of following the href", () => {
    const onOpen = vi.fn();
    render(<AtlasLink to={atlasHref("doc-a")} onOpen={onOpen}>go</AtlasLink>);
    expect(cancelledBefore(screen.getByText("go"))).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
  });
});
