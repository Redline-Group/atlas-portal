import { useSelection } from "../../lib/selection";

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
  return (
    <button
      type="button"
      className="px-1 py-0.5 rounded text-tan-3 hover:text-tan shrink-0"
      title="Clear selection"
      aria-label="Clear selection"
      onClick={clearAll}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <path d="M1 1 L9 9 M9 1 L1 9" />
      </svg>
    </button>
  );
}
