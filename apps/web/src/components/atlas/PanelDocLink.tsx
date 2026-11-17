import type { ComponentProps } from "react";
import { atlasHref } from "@/lib/routes";
import { useDocLinkShiftClick } from "./AtlasActionsContext";

export interface PanelDocLinkProps extends ComponentProps<"a"> {
  /** The document the link opens. */
  docId: string;
  /** A plain click: the panel's own navigation, which tracks the list it came from. */
  onOpen: () => void;
}

/**
 * A right-panel entry that opens a document. A real link, so a shift-click
 * follows the reader's row gesture (the comparison pane) and a middle- or
 * modifier-click opens it in the browser as any link would; only a plain
 * click goes through `onOpen`.
 */
export function PanelDocLink({ docId, onOpen, onClick, ...props }: PanelDocLinkProps) {
  const shiftClick = useDocLinkShiftClick();
  return (
    <a
      href={atlasHref(docId)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || shiftClick(e, docId)) return;
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
        e.preventDefault();
        onOpen();
      }}
      {...props}
    />
  );
}
