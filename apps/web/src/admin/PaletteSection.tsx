import type { ReactNode } from "react";

export type SectionHeadingProps = {
  /** Space below the heading, in px. */
  gap: number;
  children: ReactNode;
};

/** The small-caps heading every palette-editor section opens with. */
export function SectionHeading({ gap, children }: SectionHeadingProps) {
  return (
    <h2
      className="mono"
      style={{
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--tan-2)",
        margin: `0 0 ${gap}px`,
      }}
    >
      {children}
    </h2>
  );
}

/** The rule between the palette editor's major sections. */
export function SectionRule() {
  return <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "32px 0 24px" }} />;
}
