import { useLocation } from "wouter";
import { useDataSource } from "../../lib/dataSource";
import { useSelection } from "../../lib/selection";
import { track } from "../../lib/analytics";
import { ROUTES } from "@/lib/routes";
import { TREE_TOGGLE_BAR_CLASS, TREE_TOGGLE_PILL_CLASS, togglePillStyle, treeToggleBarStyle } from "../tree/togglePill";
import { usersEnabled } from "../../lib/usersEnabled";
import { OpenCollectionsButton } from "./OpenCollectionsButton";
import { SaveCollectionButton } from "./SaveCollectionButton";
import { SaveCollectionModal } from "./SaveCollectionModal";
import { SelectedPill } from "./SelectedPill";
import { useResumeSave } from "./useResumeSave";

// Bar above the tree (live reader). "All" plus, once docs are selected, a
// "Selected · n" filter with a clear (×), a save-as-collection button, and a
// checkbox that toggles selection mode. The select checkbox is a READER entry
// point, so it only shows on the /atlas route — not the home/search pages, where
// the tree is also mounted. With nothing selected off the reader, the whole bar
// is hidden. Always hidden in preview (PreviewTreeToggle owns this slot).
export function SelectionTreeToggle() {
  const { preview } = useDataSource();
  const [location] = useLocation();
  const { ids, selectedOnly, setSelectedOnly } = useSelection();
  const [showSave, setShowSave] = useResumeSave();

  if (preview) return null;
  const count = ids.size;
  const inReader = location === ROUTES.ATLAS;
  // Off the reader (home / search-hints), the selection UI only earns its space
  // when there's already a selection to filter — otherwise hide the bar entirely.
  if (!inReader && count === 0) return null;

  return (
    <div className={TREE_TOGGLE_BAR_CLASS} style={treeToggleBarStyle(selectedOnly && count > 0)}>
      <button
        className={`${TREE_TOGGLE_PILL_CLASS} shrink-0`}
        style={togglePillStyle(!selectedOnly, "var(--tan)")}
        onClick={() => {
          track("selection_view_toggle", { view: "all", count });
          setSelectedOnly(false);
        }}
      >
        All
      </button>

      {count > 0 && <SelectedPill />}

      <div className="flex-1" />

      {/* Saving needs the auth + collections backend, which only exists when
          logins are enabled. In static builds hide the affordance rather than
          offer a sign-in that dead-ends at a disabled /api/auth. */}
      {count > 0 && usersEnabled() && <SaveCollectionButton count={count} onOpen={() => setShowSave(true)} />}

      {/* Jump to the full Collections page (a users feature, same gate as save). */}
      {usersEnabled() && <OpenCollectionsButton />}

      {showSave && <SaveCollectionModal ids={[...ids]} onClose={() => setShowSave(false)} />}
    </div>
  );
}
