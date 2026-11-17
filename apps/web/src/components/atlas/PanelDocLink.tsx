import type { ComponentProps } from "react";
import { atlasHref } from "@/lib/routes";
import { AtlasLink } from "../AtlasLink";

export interface PanelDocLinkProps extends Omit<ComponentProps<typeof AtlasLink>, "to" | "onClick"> {
  /** The document the link opens. */
  docId: string;
  /** A plain click: the panel's own navigation, which tracks the list it came from. */
  onOpen: () => void;
}

/** A right-panel entry that opens a document: an AtlasLink, so its href carries
 *  the reader's split and filter and a shift-click opens the comparison pane,
 *  with the plain click handed to the panel's tracked navigation. */
export function PanelDocLink({ docId, onOpen, ...props }: PanelDocLinkProps) {
  return (
    <AtlasLink
      to={atlasHref(docId)}
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
      {...props}
    />
  );
}
