import { TreeBarIconButton, type TreeBarIconButtonProps } from "./TreeBarIconButton";

/** The × that clears whatever the tree bar is filtering by. */
export function TreeBarClearButton(props: Omit<TreeBarIconButtonProps, "children">) {
  return (
    <TreeBarIconButton {...props}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <path d="M1 1 L9 9 M9 1 L1 9" />
      </svg>
    </TreeBarIconButton>
  );
}
