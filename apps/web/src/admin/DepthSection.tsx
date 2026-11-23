import { SectionHeading } from "./PaletteSection";
import { SwatchGrid, type SwatchGridProps } from "./SwatchGrid";
import { depthPatternEntries } from "./depth-pattern";
import { GROUP_LABEL, TOKENS_BY_GROUP } from "./palette-tokens";

const COPY_PATTERN_STYLE: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 10px",
  background: "var(--surface)",
  color: "var(--tan-3)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export type DepthSectionProps = Omit<SwatchGridProps, "tokens"> & {
  onSetValue: (name: string, value: string) => void;
};

export function DepthSection({ onSetValue, ...grid }: DepthSectionProps) {
  function copyPattern() {
    for (const [name, value] of depthPatternEntries(grid.effectiveValue)) onSetValue(name, value);
  }

  return (
    <section>
      <SectionHeading gap={4}>{GROUP_LABEL.depth}</SectionHeading>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "0 0 10px" }}>
        <p style={{ fontSize: 12, color: "var(--tan-3)", margin: 0 }}>
          17 colors used by the doc-tree depth coloring. Editable, but keep the gradient sane.
        </p>
        <button className="mono" onClick={copyPattern} style={COPY_PATTERN_STYLE}>
          copy pattern
        </button>
      </div>
      <SwatchGrid tokens={TOKENS_BY_GROUP.get("depth") ?? []} {...grid} />
    </section>
  );
}
