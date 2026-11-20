import { useLocation } from "wouter";
import { track } from "../../lib/analytics";
import { ROUTES } from "@/lib/routes";
import { TreeBarIconButton } from "../tree/TreeBarIconButton";

/** The folder icon that jumps to the full Collections page. */
export function OpenCollectionsButton() {
  const [, navigate] = useLocation();
  return (
    <TreeBarIconButton
      label="Open collections"
      onClick={() => {
        track("collections_open_nav", {});
        navigate(ROUTES.COLLECTIONS);
      }}
    >
      <svg width="13" height="12" viewBox="0 0 13 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
        <path d="M1 2.5 h3.5 l1 1.5 h6 v6.5 h-10.5 z" />
      </svg>
    </TreeBarIconButton>
  );
}
