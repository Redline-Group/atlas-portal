import { track } from "../../lib/analytics";

export type SaveCollectionButtonProps = {
  /** How many documents are selected; reported with the open event. */
  count: number;
  /** Opens the save-collection modal. */
  onOpen: () => void;
};

/** The save (disk) icon that opens the save-as-collection modal. */
export function SaveCollectionButton({ count, onOpen }: SaveCollectionButtonProps) {
  return (
    <button
      type="button"
      className="px-1 py-0.5 rounded text-tan-3 hover:text-tan shrink-0"
      title="Save as collection"
      aria-label="Save as collection"
      onClick={() => {
        track("collection_save_open", { count });
        onOpen();
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
        <path d="M1.5 1.5 h7 l2 2 v7 h-9 z" />
        <path d="M3.5 1.5 v3 h4 v-3" />
        <path d="M3 8 h6" />
      </svg>
    </button>
  );
}
