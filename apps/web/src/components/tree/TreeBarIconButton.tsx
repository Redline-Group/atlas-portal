import type { ComponentProps } from "react";

export type TreeBarIconButtonProps = Omit<ComponentProps<"button">, "type" | "title" | "aria-label" | "className"> & {
  /** What the button does: its tooltip and its accessible name. */
  label: string;
};

/** A small icon-only action in the bar above the tree; `children` is the icon. */
export function TreeBarIconButton({ label, ...props }: TreeBarIconButtonProps) {
  return (
    <button
      type="button"
      className="px-1 py-0.5 rounded text-tan-3 hover:text-tan shrink-0"
      title={label}
      aria-label={label}
      {...props}
    />
  );
}
