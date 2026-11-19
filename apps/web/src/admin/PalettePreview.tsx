import { useMemo } from "react";
import { PALETTE_TOKENS } from "./palette-tokens";
import { PaletteTreeSamples } from "./PaletteTreeSamples";
import { PaletteTextSamples, PaletteEntitySamples, PaletteStatusSamples } from "./PaletteSamples";

interface Props {
  effectiveValue: (name: string) => string;
}

export function PalettePreview({ effectiveValue }: Props) {
  const previewVars = useMemo(
    () => Object.fromEntries(PALETTE_TOKENS.map((t) => [`--${t.name}`, effectiveValue(t.name)])) as React.CSSProperties,
    [effectiveValue],
  );

  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        className="mono"
        style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--tan-2)", margin: "0 0 6px" }}
      >
        Live Preview
      </h2>
      <p style={{ fontSize: 12, color: "var(--tan-3)", margin: "0 0 16px" }}>
        Reflects your draft before apply. CSS vars are overridden on this container.
      </p>

      <div style={{ ...previewVars, display: "flex", flexDirection: "column", gap: 20 }}>
        <PaletteTreeSamples />
        <PaletteTextSamples />
        <PaletteEntitySamples />
        <PaletteStatusSamples />
      </div>
    </section>
  );
}
