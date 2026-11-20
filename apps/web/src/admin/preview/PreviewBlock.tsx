import type { ReactNode } from "react";

export type PreviewBlockProps = {
  /** The caption above the sample. */
  label: string;
  children: ReactNode;
};

/** One captioned sample in the palette live preview. */
export function PreviewBlock({ label, children }: PreviewBlockProps) {
  return (
    <div>
      <p className="mono" style={{ fontSize: 10, color: "var(--tan-3)", margin: "0 0 6px" }}>
        {label}
      </p>
      {children}
    </div>
  );
}
