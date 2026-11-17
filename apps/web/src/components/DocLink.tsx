import type { ComponentProps } from "react";
import { atlasHref } from "@/lib/routes";
import { isPlainClick } from "../lib/clickKind";
import { useDocLinkShiftClick } from "./atlas/AtlasActionsContext";

export interface DocLinkProps extends Omit<ComponentProps<"a">, "href" | "onClick"> {
  /** The document the link opens. */
  docId: string;
  /** A plain click: the caller's in-app navigation. */
  onOpen: () => void;
}

/**
 * A link to a document whose plain click is the caller's own navigation. A
 * shift-click follows the reader's row gesture (useDocLinkShiftClick); any other
 * modifier or button is the browser's. It reads no URL state, so it suits links
 * rendered by the hundred, like those in every reader row's text. A link that
 * should carry the reader's split and filter into its href is an AtlasLink.
 *
 * The one place a component writes `href={atlasHref(…)}` by hand (see
 * DocLink.test.tsx), so every doc link gets the same gestures.
 */
export function DocLink({ docId, onOpen, ...props }: DocLinkProps) {
  const shiftClick = useDocLinkShiftClick();
  return (
    <a
      href={atlasHref(docId)}
      onClick={(e) => {
        if (shiftClick(e, docId) || !isPlainClick(e)) return;
        e.preventDefault();
        onOpen();
      }}
      {...props}
    />
  );
}
