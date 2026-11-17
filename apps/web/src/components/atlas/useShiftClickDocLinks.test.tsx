// @vitest-environment jsdom
// Shift-clicking a doc link anywhere on the page while the reader is mounted
// opens it in the comparison pane, or, from inside the pane, highlights it in
// the main reader. Everything else keeps the browser's own shift-click.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { useShiftClickDocLinks } from "./useShiftClickDocLinks";

const DOCS = new Set(["doc-a", "doc-b"]);

function Harness({ linkClick }: { linkClick: () => void }) {
  // The wrapper cancels whatever the hook lets through, so jsdom never tries
  // to follow a link.
  return (
    <div onClick={(e) => e.preventDefault()}>
      <a href="/atlas?id=doc-a" onClick={linkClick}>main link</a>
      <a href="/atlas?id=doc-a&split=doc-b">folded link</a>
      <a href="/atlas?id=unknown">unknown doc</a>
      <a href="https://example.com/atlas?id=doc-a">outside link</a>
      <a href="/reports/stale-dates?id=doc-a">other route</a>
      <div className="junior-pane">
        <a href="/atlas?id=doc-b">
          <span>pane link</span>
        </a>
      </div>
    </div>
  );
}

function setup() {
  const openInSplit = vi.fn();
  const showInMain = vi.fn();
  const linkClick = vi.fn();
  function Reader() {
    useShiftClickDocLinks({ hasDoc: (id) => DOCS.has(id), openInSplit, showInMain });
    return <Harness linkClick={linkClick} />;
  }
  render(<Reader />);
  return { openInSplit, showInMain, linkClick };
}

afterEach(cleanup);

describe("useShiftClickDocLinks", () => {
  it("opens a shift-clicked doc link in the comparison pane, ahead of the link's own handler", () => {
    const { openInSplit, showInMain, linkClick } = setup();
    const notCancelled = fireEvent.click(screen.getByText("main link"), { shiftKey: true });
    expect(openInSplit).toHaveBeenCalledWith("doc-a");
    expect(showInMain).not.toHaveBeenCalled();
    expect(linkClick).not.toHaveBeenCalled();
    expect(notCancelled).toBe(false);
  });

  it("reads the doc from a link that already carries the reader's params", () => {
    const { openInSplit } = setup();
    fireEvent.click(screen.getByText("folded link"), { shiftKey: true });
    expect(openInSplit).toHaveBeenCalledWith("doc-a");
  });

  it("highlights the doc in the main reader when the link is inside the pane", () => {
    const { openInSplit, showInMain } = setup();
    fireEvent.click(screen.getByText("pane link"), { shiftKey: true });
    expect(showInMain).toHaveBeenCalledWith("doc-b");
    expect(openInSplit).not.toHaveBeenCalled();
  });

  it("leaves a plain click to the link", () => {
    const { openInSplit, linkClick } = setup();
    fireEvent.click(screen.getByText("main link"));
    expect(linkClick).toHaveBeenCalledTimes(1);
    expect(openInSplit).not.toHaveBeenCalled();
  });

  it("leaves other modifier combinations to the browser", () => {
    const { openInSplit } = setup();
    fireEvent.click(screen.getByText("main link"), { shiftKey: true, metaKey: true });
    fireEvent.click(screen.getByText("main link"), { shiftKey: true, button: 1 });
    expect(openInSplit).not.toHaveBeenCalled();
  });

  it("ignores unknown docs, outside links and other routes", () => {
    const { openInSplit, showInMain } = setup();
    for (const text of ["unknown doc", "outside link", "other route"]) {
      fireEvent.click(screen.getByText(text), { shiftKey: true });
    }
    expect(openInSplit).not.toHaveBeenCalled();
    expect(showInMain).not.toHaveBeenCalled();
  });

  it("stops listening once the reader unmounts", () => {
    const { openInSplit } = setup();
    const link = screen.getByText("main link");
    const host = link.parentElement!;
    cleanup();
    document.body.appendChild(host);
    fireEvent.click(link, { shiftKey: true });
    expect(openInSplit).not.toHaveBeenCalled();
    host.remove();
  });
});
