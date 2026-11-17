// @vitest-environment jsdom
// DocLink is the one hand-built doc link: a plain click is the caller's
// navigation, a shift-click inside the reader opens the comparison pane, and
// every other click is the browser's. The source scan at the bottom keeps it
// the only one, so a new doc link cannot miss those gestures.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DocLink } from "./DocLink";
import { AtlasActionsContext } from "./atlas/AtlasActionsContext";

afterEach(cleanup);

function renderLink(inReader: boolean) {
  const onOpen = vi.fn();
  const actions = { navigate: vi.fn(), toggle: vi.fn(), splitNavigate: vi.fn() };
  const link = <DocLink docId="doc-a" onOpen={onOpen}>go</DocLink>;
  render(inReader ? <AtlasActionsContext.Provider value={actions}>{link}</AtlasActionsContext.Provider> : link);
  return { onOpen, splitNavigate: actions.splitNavigate, a: screen.getByText("go") };
}

// Whether anything before the document cancelled the click; cancels it after,
// so jsdom does not try to follow the link.
function cancelledBefore(a: HTMLElement, init: MouseEventInit): boolean {
  let cancelled = false;
  const watch = (e: MouseEvent) => {
    cancelled = e.defaultPrevented;
    e.preventDefault();
  };
  document.addEventListener("click", watch);
  fireEvent.click(a, init);
  document.removeEventListener("click", watch);
  return cancelled;
}

describe("DocLink", () => {
  it("is a real link to the document", () => {
    expect(renderLink(false).a).toHaveAttribute("href", "/atlas?id=doc-a");
  });

  it("hands a plain click to onOpen", () => {
    const { onOpen, a } = renderLink(true);
    expect(cancelledBefore(a, {})).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("opens the comparison pane on shift-click inside the reader", () => {
    const { onOpen, splitNavigate, a } = renderLink(true);
    fireEvent.click(a, { shiftKey: true });
    expect(splitNavigate).toHaveBeenCalledWith("doc-a", "link");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("leaves modifier clicks to the browser, and shift-click too outside the reader", () => {
    const inside = renderLink(true);
    expect(cancelledBefore(inside.a, { metaKey: true })).toBe(false);
    expect(cancelledBefore(inside.a, { ctrlKey: true })).toBe(false);
    expect(inside.onOpen).not.toHaveBeenCalled();
    cleanup();
    const outside = renderLink(false);
    expect(cancelledBefore(outside.a, { shiftKey: true })).toBe(false);
    expect(outside.onOpen).not.toHaveBeenCalled();
  });
});

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [full] : [];
  });
}

// Files allowed to write a doc link by hand, and why.
const ALLOWED: Record<string, string> = {
  "components/DocLink.tsx": "the primitive itself",
  "components/chat/markdown.tsx": "chat sits outside the reader; shift-click goes through onAtlas({ split })",
  "components/chat/Sources.tsx": "chat sits outside the reader; shift-click goes through onAtlas({ split })",
  "components/chat/FindingCite.tsx": "chat sits outside the reader; shift-click goes through onAtlas({ split })",
};

describe("doc links in source", () => {
  it("are built by hand only in DocLink (or a listed exception)", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => readFileSync(f, "utf8").includes("href={atlasHref("))
      .map((f) => path.relative(SRC, f).split(path.sep).join("/"))
      .filter((f) => !(f in ALLOWED));
    // A doc link: <DocLink> for a link with its own click handler, <AtlasLink>
    // for one whose href navigates.
    expect(offenders).toEqual([]);
  });
});
