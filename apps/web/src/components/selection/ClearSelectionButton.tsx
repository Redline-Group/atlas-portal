import { useSelection } from "../../lib/selection";
import { TreeBarClearButton } from "../tree/TreeBarClearButton";

/** The clear (×) button beside the "Selected" pill. */
export function ClearSelectionButton() {
  const { setSelectedOnly, setActiveCollectionId, setActiveCollectionName, clear } = useSelection();
  // Also drop the view mode + active collection: otherwise selectedOnly
  // stays true in the URL, the filter vanishes (no ids), and the next
  // checkbox snaps straight back into a hidden selected-only view.
  const clearAll = () => {
    clear();
    setSelectedOnly(false);
    setActiveCollectionId(null);
    setActiveCollectionName(null);
  };
  return <TreeBarClearButton label="Clear selection" onClick={clearAll} />;
}
