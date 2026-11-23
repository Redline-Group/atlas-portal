import type { ReactNode } from "react";

export type SectionHeadingProps = {
  gap: number;
  children: ReactNode;
};

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

export function SectionRule() {
  return <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "32px 0 24px" }} />;
}
