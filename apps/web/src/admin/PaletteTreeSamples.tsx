import { DocNoChiclets } from "../components/DocNoChiclets";
import { chicletColor, segmentDepths } from "@/lib/depth";

const TREE_SAMPLES = [
  { docNo: "A.1",         title: "Scope — Sky Atlas" },
  { docNo: "A.1.2",       title: "Article — Immutable Documents" },
  { docNo: "A.1.2.3",     title: "Section — Definitions" },
  { docNo: "A.3.1.2.4",   title: "Core — Accessibility Scope" },
  { docNo: "A.3.1.2.4.1", title: "Instance" },
] as const;

function barColor(treeDepth: number): string {
  const depthVar = `var(--depth-${Math.min(Math.max(treeDepth, 1), 17)})`;
  return `color-mix(in srgb, ${depthVar} 80%, var(--row-bar-tint))`;
}

export function PaletteTreeSamples() {
  return (
    <div>
      <p className="mono" style={{ fontSize: 10, color: "var(--tan-3)", margin: "0 0 6px" }}>
        doc-tree rows (depth chiclets + bar)
      </p>
      <div style={{ background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
        {TREE_SAMPLES.map(({ docNo, title }, i) => {
          const parts = docNo.split(".");
          const depths = segmentDepths(docNo);
          const treeDepth = parts.length;
          const bar = barColor(treeDepth);
          const titleColor = chicletColor(depths[depths.length - 1] ?? 0);
          return (
            <div
              key={docNo}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px 5px 0",
                paddingLeft: 4 + (treeDepth - 1) * 10,
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
                boxShadow: `inset 2px 0 0 ${bar}`,
                background: i === 2 ? "var(--atlas-row-selected)" : "transparent",
              }}
            >
              <DocNoChiclets parts={parts} depths={depths} />
              <span style={{ fontSize: 13, color: titleColor, fontWeight: 600 }}>{title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
