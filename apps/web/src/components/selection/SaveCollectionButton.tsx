import { TreeBarIconButton } from "../tree/TreeBarIconButton";

export type SaveCollectionButtonProps = {
  /** Opens the save-collection modal. */
  onOpen: () => void;
};

/** The save (disk) icon that opens the save-as-collection modal. */
export function SaveCollectionButton({ onOpen }: SaveCollectionButtonProps) {
  return (
    <TreeBarIconButton
      label="Save as collection"
      onClick={onOpen}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
        <path d="M1.5 1.5 h7 l2 2 v7 h-9 z" />
        <path d="M3.5 1.5 v3 h4 v-3" />
        <path d="M3 8 h6" />
      </svg>
    </TreeBarIconButton>
  );
}
