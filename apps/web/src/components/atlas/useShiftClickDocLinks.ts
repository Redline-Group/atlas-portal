import { useEffect, useRef } from "react";
import { ROUTES } from "@/lib/routes";

/** The comparison pane's root. A doc link shift-clicked inside it shows the
 *  doc in the main reader instead of re-opening it in the pane. */
const SPLIT_PANE_SELECTOR = ".junior-pane";

/** The document a same-page reader link opens, or null for anything else: an
 *  outside link, another route, or a different preview's reader. */
export function readerLinkTarget(a: HTMLAnchorElement): string | null {
  const raw = a.getAttribute("href");
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  if (url.pathname !== ROUTES.ATLAS && url.pathname !== window.location.pathname) return null;
  return url.searchParams.get("id");
}

const isShiftClick = (e: MouseEvent) =>
  e.shiftKey && e.button === 0 && !(e.ctrlKey || e.metaKey || e.altKey);

export interface ShiftClickDocLinks {
  /** Whether the reader holds this document; other ids keep the browser's shift-click. */
  hasDoc: (id: string) => boolean;
  /** A doc link shift-clicked outside the comparison pane: open it in the pane. */
  openInSplit: (id: string) => void;
  /** A doc link shift-clicked inside the comparison pane: show it in the main reader. */
  showInMain: (id: string) => void;
}

/**
 * While the reader is mounted, shift-clicking any link to a document — in the
 * reader's text, its panels and breadcrumbs, or the chat — does what
 * shift-clicking that document's row does. One capture listener on the
 * document, so every link qualifies without each renderer opting in, and the
 * link's own click handler (a plain navigation) never runs.
 */
export function useShiftClickDocLinks(handlers: ShiftClickDocLinks): void {
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isShiftClick(e) || !(e.target instanceof Element)) return;
      const a = e.target.closest("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      const id = readerLinkTarget(a);
      if (!id || !latest.current.hasDoc(id)) return;
      e.preventDefault();
      e.stopPropagation();
      if (a.closest(SPLIT_PANE_SELECTOR)) latest.current.showInMain(id);
      else latest.current.openInSplit(id);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}
