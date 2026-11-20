import { PreviewTreeRow } from "./PreviewTreeRow";
import { PreviewBlock } from "./PreviewBlock";

const TREE_SAMPLES = [
  { docNo: "A.1",         title: "Scope — Sky Atlas" },
  { docNo: "A.1.2",       title: "Article — Immutable Documents" },
  { docNo: "A.1.2.3",     title: "Section — Definitions" },
  { docNo: "A.3.1.2.4",   title: "Core — Accessibility Scope" },
  { docNo: "A.3.1.2.4.1", title: "Instance" },
] as const;

/** Doc-tree rows: depth chiclets, the depth bar, and one selected row. */
export function PreviewTreeRows() {
  return (
    <PreviewBlock label="doc-tree rows (depth chiclets + bar)">
      <div style={{ background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
        {TREE_SAMPLES.map(({ docNo, title }, i) => (
          <PreviewTreeRow key={docNo} docNo={docNo} heading={title} first={i === 0} selected={i === 2} />
        ))}
      </div>
    </PreviewBlock>
  );
}
