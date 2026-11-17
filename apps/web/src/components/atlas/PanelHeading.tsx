import type { ReactNode } from "react";
import { SECTION_HEAD } from "./panelSections";

/** A right-panel section heading, with the mark of what the section is beside it when it is not Atlas text. */
export function PanelHeading({ mark, className = "mb-3", children }: { mark?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <p className={`${SECTION_HEAD} ${className} flex items-center gap-2`}>
      {children}
      {mark}
    </p>
  );
}
