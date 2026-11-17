import { useCallback, useEffect, useRef } from "react";
import { ROUTES } from "@/lib/routes";
import { track } from "../../lib/analytics";
import type { SplitChange } from "../../hooks/useSplitPane";

/** The comparison pane's root class. JuniorPane renders it and the link
 *  listener below keys on it, so the two cannot drift apart. */
export const SPLIT_PANE_CLASS = "junior-pane";

/** How a doc reached the main reader from the comparison pane. */
export type ShowInMainVia = "row" | "link";

/** The document a same-page reader link opens, or null for anything else: an
 *  outside link, another route, or a different preview's reader. */
function readerLinkTarget(a: HTMLAnchorElement): string | null {
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
  /** Opens a doc in the comparison pane: a doc link shift-clicked outside it. */
  openInSplit: SplitChange;
  /** Selects a doc in the main reader. */
  navigate: (id: string) => void;
}

/** Selects a doc in the main reader from the comparison pane, and records it.
 *  The current doc and pane are read from the URL at click time, so the
 *  callback keeps one identity across navigation. */
function useShowInMain(navigate: (id: string) => void) {
  return useCallback(
    (target: string, via: ShowInMainVia = "row") => {
      const live = new URLSearchParams(window.location.search);
      track("reader_split_show_in_main", { node_id: live.get("id"), split_id: live.get("split"), target_id: target, via });
      navigate(target);
    },
    [navigate],
  );
}

/**
 * While the reader is mounted, shift-clicking any link to a document — in the
 * reader's text, its panels and breadcrumbs, or the chat — does what
 * shift-clicking that document's row does: outside the comparison pane it opens
 * the doc in the pane, inside the pane it selects the doc in the main reader.
 * One capture listener on the document, so every link qualifies without each
 * renderer opting in, and the link's own click handler (a plain navigation)
 * never runs.
 *
 * Returns the tracked show-in-main action, for the pane's rows to share.
 */
export function useShiftClickDocLinks(handlers: ShiftClickDocLinks) {
  const showInMain = useShowInMain(handlers.navigate);
  const latest = useRef({ ...handlers, showInMain });
  latest.current = { ...handlers, showInMain };
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isShiftClick(e) || !(e.target instanceof Element)) return;
      const a = e.target.closest("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      const id = readerLinkTarget(a);
      if (!id || !latest.current.hasDoc(id)) return;
      e.preventDefault();
      e.stopPropagation();
      if (a.closest(`.${SPLIT_PANE_CLASS}`)) latest.current.showInMain(id, "link");
      else latest.current.openInSplit(id, "link");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return showInMain;
}
