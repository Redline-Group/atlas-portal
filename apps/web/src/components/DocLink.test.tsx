// @vitest-environment jsdom
// DocLink: a plain click is the caller's navigation, a shift-click inside the
// reader opens the comparison pane, and every other click is the browser's.
// The source scan at the bottom keeps every doc link on DocLink or AtlasLink,
// so a new one cannot miss those gestures.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DocLink } from "./DocLink";
import { AtlasActionsContext } from "./atlas/AtlasActionsContext";
import { cancelledBefore, makeAtlasActions } from "../test/readerLinks";

afterEach(cleanup);

function renderLink(inReader: boolean) {
  const onOpen = vi.fn();
  const actions = makeAtlasActions();
  const link = <DocLink docId="doc-a" onOpen={onOpen}>go</DocLink>;
  render(inReader ? <AtlasActionsContext.Provider value={actions}>{link}</AtlasActionsContext.Provider> : link);
  return { onOpen, splitNavigate: actions.splitNavigate, a: screen.getByText("go") };
}

describe("DocLink", () => {
  it("is a real link to the document", () => {
    expect(renderLink(false).a).toHaveAttribute("href", "/atlas?id=doc-a");
  });

  it("hands a plain click to onOpen", () => {
    const { onOpen, a } = renderLink(true);
    expect(cancelledBefore(a)).toBe(true);
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

const sourceFiles = (): string[] =>
  readdirSync(SRC, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
    .map((f) => f.split(path.sep).join("/"));

// A doc link written by hand: an anchor or a bare wouter Link pointed at
// atlasHref. Either one skips the reader's shift-click.
const HAND_BUILT = [/<a\b[^>]*?\bhref=\{\s*atlasHref\(/, /<Link\b[^>]*?\bto=\{\s*atlasHref\(/];

// Paths (a file, or a folder ending in "/") allowed to, and why.
const ALLOWED: Record<string, string> = {
  "components/DocLink.tsx": "the primitive itself",
  "components/crossview/": "the CrossView report, off the reader: no comparison pane to open",
  "components/visits/": "the visits page, off the reader: no comparison pane to open",
};

const allowed = (f: string) => Object.keys(ALLOWED).some((a) => (a.endsWith("/") ? f.startsWith(a) : f === a));

describe("doc links in source", () => {
  it("go through DocLink or AtlasLink (or a listed exception)", () => {
    const offenders = sourceFiles().filter((f) => {
      const text = readFileSync(path.join(SRC, f), "utf8");
      return HAND_BUILT.some((re) => re.test(text)) && !allowed(f);
    });
    // <DocLink> for a link that runs its own navigation and reads no URL state;
    // <AtlasLink> (with onOpen for its own navigation) for one whose href
    // should carry the reader's split and filter.
    expect(offenders).toEqual([]);
  });
});
