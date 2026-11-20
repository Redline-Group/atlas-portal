import { useSelection } from "../../lib/selection";
import { track } from "../../lib/analytics";
import { ClearSelectionButton } from "./ClearSelectionButton";
import { TREE_TOGGLE_PILL_CLASS, togglePillStyle } from "../tree/togglePill";

/** The "Selected · n" filter pill (named after the active collection when
 *  there is one) and the clear (×) button beside it. */
export function SelectedPill() {
  const { ids, selectedOnly, setSelectedOnly, activeCollectionName } = useSelection();
  const count = ids.size;
  const showSelected = () => {
    track("selection_view_toggle", { view: "selected_only", count });
    setSelectedOnly(true);
  };
  return (
    <>
      <button
        className={`${TREE_TOGGLE_PILL_CLASS} flex items-center gap-1 min-w-0`}
        style={togglePillStyle(selectedOnly, "var(--tan)")}
        title={activeCollectionName ?? undefined}
        onClick={showSelected}
      >
        {/* Name yields first (truncates) when the row is cramped; on a wide
            sidebar it shows in full — no fixed cap, just flex shrink. */}
        <span className="truncate min-w-0">{activeCollectionName ?? "Selected"}</span>
        <span className="shrink-0">· {count}</span>
      </button>
      <ClearSelectionButton />
    </>
  );
}
