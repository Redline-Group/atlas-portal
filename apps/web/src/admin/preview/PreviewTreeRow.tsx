import { DocNoChiclets } from "../../components/DocNoChiclets";
import { chicletColor, segmentDepths } from "@/lib/depth";

export type PreviewTreeRowProps = {
  docNo: string;
  /** The row's heading text. */
  heading: string;
  /** Every row but the first draws a top border. */
  first: boolean;
  /** Draws the selected-row fill. */
  selected: boolean;
};

export function PreviewTreeRow({ docNo, heading, first, selected }: PreviewTreeRowProps) {
  const parts = docNo.split(".");
  const depths = segmentDepths(docNo);
  const treeDepth = parts.length;
  const depthVar = `var(--depth-${Math.min(Math.max(treeDepth, 1), 17)})`;
  const bar = `color-mix(in srgb, ${depthVar} 80%, var(--row-bar-tint))`;
  const titleColor = chicletColor(depths[depths.length - 1] ?? 0);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 12px 5px 0",
        paddingLeft: 4 + (treeDepth - 1) * 10,
        borderTop: first ? "none" : "1px solid var(--border)",
        boxShadow: `inset 2px 0 0 ${bar}`,
        background: selected ? "var(--atlas-row-selected)" : "transparent",
      }}
    >
      <DocNoChiclets parts={parts} depths={depths} />
      <span style={{ fontSize: 13, color: titleColor, fontWeight: 600 }}>{heading}</span>
    </div>
  );
}
