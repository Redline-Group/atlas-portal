import { useRef } from "react";
import { useDataSource } from "../../lib/dataSource";
import { usePreviewView } from "../../lib/previewView";
import { usePreviewDiff } from "../../lib/previewDiff";
import { describeFilters, filterPreviewDocs } from "../../lib/previewFilters";
import { changedIds } from "../../lib/previewChangeKind";
import { track } from "../../lib/analytics";
import { useDismissiblePopover } from "../chat/useLightDismiss";
import { TREE_TOGGLE_BAR_CLASS, TREE_TOGGLE_PILL_CLASS, togglePillStyle, treeToggleBarStyle } from "../tree/togglePill";
import { TreeBarClearButton } from "../tree/TreeBarClearButton";
import { PreviewFilterTrigger } from "./PreviewFilterTrigger";
import { PreviewFilterMenu } from "./PreviewFilterMenu";

const MENU_ID = "preview-filter-menu";

// Sits above the tree in preview mode: "All", then a Filter button whose menu
// picks which changes to show (previewFilters.ts), then × to clear. The view is
// shared state, so it filters both this sidebar AND the reader area. The menu
// hangs off the whole bar, so it spans the sidebar's width.
export function PreviewTreeToggle() {
  const { preview } = useDataSource();
  const { onlyChanged, setOnlyChanged, changeFilters } = usePreviewView();
  const diff = usePreviewDiff();
  const barRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useDismissiblePopover(barRef, { claimEscape: true });
  if (!preview) return null;
  const changedCount = changedIds(diff).size;

  const showAll = (via: "all" | "clear") => {
    track("preview_view_toggle", { view: "all", changed_count: changedCount, via });
    setOnlyChanged(false);
    setOpen(false);
  };

  return (
    <div ref={barRef} className={TREE_TOGGLE_BAR_CLASS} style={treeToggleBarStyle(onlyChanged)}>
      <button
        type="button"
        className={`${TREE_TOGGLE_PILL_CLASS} shrink-0`}
        style={togglePillStyle(!onlyChanged, "var(--tan)")}
        onClick={() => showAll("all")}
      >
        All
      </button>
      <PreviewFilterTrigger
        active={onlyChanged}
        label={onlyChanged ? describeFilters(changeFilters) : "Filter"}
        count={onlyChanged ? filterPreviewDocs(diff, changeFilters).size : null}
        open={open}
        menuId={MENU_ID}
        onClick={() => setOpen((v) => !v)}
      />
      {onlyChanged && <TreeBarClearButton label="Clear filter" onClick={() => showAll("clear")} />}
      {open && <PreviewFilterMenu id={MENU_ID} onPicked={() => setOpen(false)} />}
    </div>
  );
}
